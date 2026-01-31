#![allow(warnings)]
use std::path::PathBuf;
use std::sync::Mutex;

use once_cell::sync::OnceCell;
use rodio::{OutputStream, Sink};
use rusqlite::Connection;
use sysinfo::{System, SystemExt, ProcessExt, Signal};
use tauri::{Manager, WindowEvent};
use tauri::path::BaseDirectory;
use tauri_plugin_shell::ShellExt;

mod commands;
use futures_util::{StreamExt, SinkExt};


// Import your commands
use commands::gyms::{get_app_version, sync_gym_data, fetch_gym_dashboard};
use commands::packages::{fetch_packages, upsert_package, delete_package};
use commands::user::fetch_user_access_view;
use commands::staff::{fetch_staff, upsert_staff, delete_staff};
use commands::dirty::{mark_record_dirty, comment_table};
use commands::sync_log::*;
use commands::sync::*;
use commands::admission::*;
use commands::upsert_local::*;
use commands::query::*;
use commands::inserts_local::{
    insert_flexible_admission,
    delete_record_by_name,
    upsert_branch_local,
    upsert_user_local,
    upsert_transaction_local
};
use commands::messaging_ext::send_to_extension;
use commands::templates::{fetch_templates_by_gym, upsert_template_local};
use commands::expenses::upsert_expense_local;
use commands::zkteco::*;
use commands::secugen::*;
use commands::arduino::send_to_arduino;
use commands::config::load_config;
mod utils; // ADD THIS
use tauri::AppHandle; 
use utils::ensure_user_asset; // IMPORT THIS
use commands::state::ZkProcessState;
use commands::config::*;
use std::fs;

static SERVICE_STARTED: OnceCell<bool> = OnceCell::new();

/// Global DB state
pub struct DbConnection(pub Mutex<Option<Connection>>);


/// =====================================================================
/////  Resolve DB path in platform-safe location
/// =====================================================================
fn resolve_local_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .resolve("local_gym.db", BaseDirectory::AppLocalData)
        .map_err(|e| format!("DB path resolve error: {}", e))?;
    Ok(path)
}

use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio_tungstenite::{accept_async, tungstenite::Message};

#[derive(Debug, Deserialize)]
struct IncomingQuery {
    r#type: String,
    query: String,
}

#[derive(Debug, Serialize)]
struct OutgoingResponse {
    r#type: String,
    query: String,
    data: serde_json::Value,
    status: String,
}
use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::sync::Mutex as AsyncMutex;
static EXTENSION_WS: Lazy<Arc<AsyncMutex<Option<WsWriter>>>> =
    Lazy::new(|| Arc::new(AsyncMutex::new(None)));

type WsWriter = Arc<AsyncMutex<futures_util::stream::SplitSink<
    tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>,
    Message
>>>;

pub async fn start_websocket_sql_server(app: AppHandle) {
    let listener = TcpListener::bind("127.0.0.1:8787")
        .await
        .expect("Failed to bind WebSocket");

    println!("WebSocket SQL server running at ws://127.0.0.1:8787");

    while let Ok((stream, _)) = listener.accept().await {
        let app = app.clone();

        tokio::spawn(async move {
            let ws_stream = match accept_async(stream).await {
                Ok(ws) => ws,
                Err(err) => {
                    eprintln!("WebSocket handshake failed: {:?}", err);
                    return;
                }
            };

            println!("Extension connected via WebSocket");

            // Split read/write
            let (write, mut read) = ws_stream.split();

            // Wrap the writer inside an async mutex
            let writer: WsWriter = Arc::new(AsyncMutex::new(write));

            // ---- Store as global writer so Tauri commands can send messages ----
            {
                let mut slot = EXTENSION_WS.lock().await;
                *slot = Some(writer.clone());
            }

            // ---- Push "welcome" message immediately ----
            let writer_clone = writer.clone();
            tokio::spawn(async move {
                let mut w = writer_clone.lock().await;
                let _ = w.send(Message::Text(
                    "{\"type\":\"welcome\",\"msg\":\"Connected\"}".into()
                )).await;
            });

            // ---- Heartbeat every 10 sec ----
            let heartbeat_writer = writer.clone();
            tokio::spawn(async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(10)).await;
                    let mut w = heartbeat_writer.lock().await;

                    let _ = w.send(Message::Text(
                        "{\"type\":\"heartbeat\",\"status\":\"alive\"}".into()
                    )).await;
                }
            });

            // ---- Main Request / Response Loop ----
            while let Some(Ok(msg)) = read.next().await {
                if !msg.is_text() {
                    continue;
                }

                let raw = msg.into_text().unwrap();
                println!("Received WS Message: {}", raw);

                let parsed: Result<IncomingQuery, _> = serde_json::from_str(&raw);

                match parsed {
                    Ok(req) => {
                        let result_string = run_sql_query_from_tauri(&app, &req.query);
                        let data_json = serde_json::from_str(&result_string)
                            .unwrap_or(serde_json::Value::Null);

                        let response = OutgoingResponse {
                            r#type: req.r#type,
                            query: req.query,
                            data: data_json,
                            status: "ok".into(),
                        };

                        let json_response = serde_json::to_string(&response).unwrap();

                        let mut w = writer.lock().await;
                        let _ = w.send(Message::Text(json_response)).await;
                    }

                    Err(_) => {
                        let mut w = writer.lock().await;
                        let _ = w.send(Message::Text(
                            "{\"status\":\"error\",\"message\":\"Invalid request format\"}".into()
                        )).await;
                    }
                }
            }

            println!("WebSocket disconnected");

            // ---- Remove writer on disconnect ----
            {
                let mut slot = EXTENSION_WS.lock().await;
                *slot = None;
            }
        });
    }
}

#[tauri::command]
async fn push_to_extension(msg: String) -> Result<(), String> {
    let lock = EXTENSION_WS.lock().await;

    if let Some(writer) = &*lock {
        let mut w = writer.lock().await;
        w.send(Message::Text(msg)).await.map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Extension not connected".into())
    }
}


fn run_sql_query_from_tauri(app: &tauri::AppHandle, sql: &str) -> String {
    let state = app.state::<DbConnection>();
    let guard = state.0.lock().unwrap();
    let conn = guard.as_ref().unwrap();

    let mut stmt = match conn.prepare(sql) {
        Ok(s) => s,
        Err(e) => return json_error(e),
    };

    let rows_iter = match stmt.query_map([], |row| {
    let mut map = serde_json::Map::new();

        for (i, col) in row.as_ref().column_names().iter().enumerate() {
            use rusqlite::types::Value;

            let value: Value = row.get(i)?;
            let json_value = match value {
                Value::Null => serde_json::Value::Null,
                Value::Integer(v) => serde_json::Value::from(v),
                Value::Real(v) => serde_json::Value::from(v),
                Value::Text(v) => serde_json::Value::from(v),
                Value::Blob(v) => {
                    // Convert blob to hex or base64
                    serde_json::Value::from(base64::encode(v))
                }
            };

            map.insert(col.to_string(), json_value);
        }

        Ok(serde_json::Value::Object(map))
    }) {
        Ok(iter) => iter,
        Err(e) => return json_error(e),
    };


    let mut output = vec![];

    for row in rows_iter {
        if let Ok(value) = row {
            output.push(value);
        }
    }

    serde_json::json!({ "rows": output }).to_string()
}

fn json_error<E: std::fmt::Display>(e: E) -> String {
    serde_json::json!({ "error": e.to_string() }).to_string()
}

/// =====================================================================
///  Copy master DB from bundled assets → app writable directory
/// =====================================================================

fn initialize_sqlite_db(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let db_path = resolve_local_db_path(app)?;

    // Ensure directory exists
    if let Some(dir) = db_path.parent() {
        std::fs::create_dir_all(dir)
            .map_err(|e| format!("Failed to create DB directory: {}", e))?;
    }

    // If DB does not exist → copy from resources
    if !db_path.exists() {
        let bundled = app
            .path()
            .resolve("resources/sqlite/local_gym.db", BaseDirectory::Resource)
            .map_err(|e| format!("Bundled DB not found: {}", e))?;

        std::fs::copy(&bundled, &db_path)
            .map_err(|e| format!("DB copy failed: {}", e))?;
    }

    Ok(db_path)
}

#[tauri::command]
fn get_logo_base64(app: AppHandle) -> Result<String, String> {
    let path = ensure_user_asset(&app, "gym-logo.jpg")?;
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;

    Ok(format!("data:image/jpeg;base64,{}", base64::encode(bytes)))
}

use tauri_plugin_shell::process::CommandEvent;
use copy_dir::copy_dir;
fn get_whatsapp_install_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("app data dir should exist")
        .join("whatsapp")
}
fn normalize_path(p: PathBuf) -> PathBuf {
    let s = p.to_string_lossy();
    if s.starts_with(r"\\?\") {
        PathBuf::from(&s[4..])
    } else {
        p
    }
}

fn resolve_resource(app: &tauri::AppHandle, folder: &str) -> Result<PathBuf, String> {
    app.path()
        .resolve(folder, tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed resolving resource {}: {}", folder, e))
}

use fs_extra::dir::{copy, CopyOptions};
use std::path::{Path};
fn is_dir_empty(path: &Path) -> bool {
    match fs::read_dir(path) {
        Ok(mut entries) => entries.next().is_none(),
        Err(_) => true,
    }
}

fn read_version(path: &Path) -> Option<String> {
    fs::read_to_string(path).ok().map(|v| v.trim().to_string())
}
fn install_whatsapp_engine(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let root = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let install_dir = root.join("whatsapp");

    fs::create_dir_all(&install_dir).map_err(|e| e.to_string())?;

    let bundled_dir = app
        .path()
        .resolve("resources/whatsapp", BaseDirectory::Resource)
        .map_err(|e| format!("Failed resolving WhatsApp resource: {}", e))?;

    // --- Version paths ---
    let bundled_version_path = bundled_dir.join("engine.version");
    let installed_version_path = install_dir.join("engine.version");
    // --- Read bundled version (MUST exist) ---
    let bundled_version = read_version(&bundled_version_path)
        .ok_or("Bundled engine.version missing — build is invalid")?;

    // --- Read installed version (optional) ---
    let installed_version = read_version(&installed_version_path)
        .unwrap_or("0.0.0".to_string());

    // --- Compare ---
    if bundled_version == installed_version && !is_dir_empty(&install_dir) {
        println!("WhatsApp engine up-to-date → {}", bundled_version);
        return Ok(install_dir);
    }

    println!(
        "Updating WhatsApp engine {} → {}",
        installed_version, bundled_version
    );

    // --- Copy engine ---
    let mut opts = CopyOptions::new();
    opts.copy_inside = true;
    opts.overwrite = true;

    copy(&bundled_dir, &install_dir, &opts)
        .map_err(|e| format!("Copy error: {}", e))?;

    // --- Write engine.version AFTER copy ---
    fs::write(&installed_version_path, &bundled_version)
        .map_err(|e| format!("Failed writing engine.version: {}", e))?;

    println!("WhatsApp engine updated → {}", bundled_version);

    Ok(install_dir)
}


#[derive(Default)]
pub struct EngineState {
    pub pid: Mutex<Option<u32>>,
}
fn kill_pid(pid: u32) {
    let mut system = sysinfo::System::new_all();
    system.refresh_all();

    let spid = sysinfo::Pid::from(pid as usize);

    if let Some(process) = system.process(spid) {
        println!("Killing WhatsApp Engine Node (PID: {})", pid);
        process.kill_with(sysinfo::Signal::Kill);
    }
}
use std::time::Duration;

use commands::whatsapp_update::update_whatsapp_engine;
#[tauri::command]
async fn update_engine(app: tauri::AppHandle) -> Result<(), String> {
    update_whatsapp_engine(&app).await
}


#[tauri::command]
async fn start_whatsapp_engine(
    app: tauri::AppHandle,
    state: tauri::State<'_, EngineState>,
) -> Result<(), String> {
    use std::time::Duration;
    update_whatsapp_engine(&app).await?;
    // ---------------------------------------------------------
    // 1. Ensure engine installed
    // ---------------------------------------------------------
    let install_path = install_whatsapp_engine(&app)?;
    println!("WhatsApp engine installed at {:?}", install_path);

    // ---------------------------------------------------------
    // 2. Prevent double spawn
    // ---------------------------------------------------------
    if is_engine_running().await {
        println!("WhatsApp engine already running.");
        return Ok(());
    }

    // ---------------------------------------------------------
    // 3. Resolve engine.js
    // ---------------------------------------------------------
    let engine_path = install_path.join("whatsapp").join("whatsapp-engine.js");

    if !engine_path.exists() {
        return Err(format!("Engine script not found at {:?}", engine_path));
    }

    // ---------------------------------------------------------
    // 4. Spawn Node process
    // ---------------------------------------------------------
    let (_rx, mut child) = app
        .shell()
        .command("node")
        .args([engine_path.to_string_lossy().to_string()])
        .current_dir(install_path.clone())
        .spawn()
        .map_err(|e| format!("Failed to spawn WhatsApp engine: {}", e))?;

    let pid = child.pid();

    println!("WhatsApp engine PID = {}", pid);

    // ✅ STORE PID
    *state.pid.lock().unwrap() = Some(pid);

    // ---------------------------------------------------------
    // 5. Wait for WS availability
    // ---------------------------------------------------------
    for _ in 0..20 {
        if is_engine_running().await {
            println!("WhatsApp engine reachable.");
            return Ok(());
        }
        tokio::time::sleep(Duration::from_millis(300)).await;
    }

    println!("Engine spawned but WS not reachable yet.");
    Ok(())
}
#[tauri::command]
async fn stop_whatsapp_engine(
    state: tauri::State<'_, EngineState>,
) -> Result<(), String> {
    use std::process::Command;

    let mut pid_lock = state.pid.lock().unwrap();

    if let Some(pid) = *pid_lock {
        println!("Stopping WhatsApp engine PID {}", pid);

        #[cfg(target_os = "windows")]
        {
            Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/F"])
                .output()
                .map_err(|e| format!("Failed to kill engine: {}", e))?;
        }

        #[cfg(not(target_os = "windows"))]
        {
            Command::new("kill")
                .arg(pid.to_string())
                .output()
                .map_err(|e| format!("Failed to kill engine: {}", e))?;
        }

        *pid_lock = None;
    }

    Ok(())
}

use tokio::net::TcpStream;
async fn is_engine_running() -> bool {
    match TcpStream::connect("127.0.0.1:8810").await {
        Ok(_) => true,
        Err(_) => false,
    }
}

/// =====================================================================
////   Kill external processes (ZKBridge, Secugen)
/// =====================================================================
fn kill_process(name: &str) {
    let mut system = System::new_all();
    system.refresh_all();

    for (pid, process) in system.processes() {
        if process.name().eq_ignore_ascii_case(name) {
            println!("Killing {} (PID: {})", name, pid);
            process.kill_with(Signal::Kill);
        }
    }
}

/// =====================================================================
///                          MAIN ENTRY POINT
/// =====================================================================
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            
            // existing DB setup...
            let db_path = initialize_sqlite_db(&handle)?;
            println!("SQLite DB Path: {}", db_path.display());

            let conn = Connection::open(&db_path)
                .map_err(|e| format!("Failed to open SQLite DB: {}", e))?;

            app.manage(DbConnection(Mutex::new(Some(conn))));
            app.manage(ZkProcessState::new());
            app.manage(FpState::default());
            app.manage(EngineState::default());
            Ok(())
        })
        .on_window_event(|window, event| {
                if let WindowEvent::CloseRequested { .. } = event {
                    println!("Window is closing — running cleanup.");
                     let state = window.state::<EngineState>();
                    let pid = state.pid.lock().unwrap().take();
                    if let Some(pid) = pid {
                        println!("App closing → killing engine PID {}", pid);

                        #[cfg(target_os = "windows")]
                        {
                            let _ = std::process::Command::new("taskkill")
                                .args(["/PID", &pid.to_string(), "/F"])
                                .output();
                        }

                        #[cfg(not(target_os = "windows"))]
                        {
                            let _ = std::process::Command::new("kill")
                                .arg(pid.to_string())
                                .output();
                        }
                    }
                    // Clone app handle twice: one for async, one for local use
                    let app_for_async = window.app_handle().clone();
                    let app_for_pid   = window.app_handle().clone();

                    // ----------------------------------------------
                    // ASYNC CLEANUP FOR ZK DEVICES
                    // ----------------------------------------------
                    tauri::async_runtime::spawn(async move {
                        let state = app_for_async.state::<ZkProcessState>();
                        if let Err(e) = zk_disconnect(state).await {
                            eprintln!("zk_disconnect failed: {:?}", e);
                        }
                    });

                    // Kill native device processes
                    kill_process("ZKBridge.exe");
                    kill_process("SecuGenDemo.exe");

                    // ----------------------------------------------
                    // WHATSAPP PID CLEANUP (NO LIFETIME ERRORS)
                    // ----------------------------------------------
                    // let pid = {
                    //     let engine_state = app_for_pid.state::<EngineState>();
                    //     let guard = engine_state.whatsapp_pid.lock().unwrap();
                    //     let x = *guard;         // extract PID safely
                    //     x                       // this value returned from block
                    // }; // guard dropped HERE

                    // if let Some(pid) = pid {
                    //     println!("Killing WhatsApp Node process PID {}", pid);
                    //     kill_pid(pid);
                    // }
                }
            })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            sync_gym_data,
            fetch_gym_dashboard,
            fetch_packages,
            upsert_package,
            delete_package,
            fetch_user_access_view,
            fetch_staff,
            upsert_staff,
            delete_staff,
            fetch_dirty_records,
            mark_records_as_synced,
            mark_records_as_unsynced,
            insert_full_admission,
            mark_record_dirty,
            comment_table,
            get_sync_time,
            update_sync_time,
            upsert_local_records,
            upsert_attendance,
            run_sqlite_query,
            insert_flexible_admission,
            delete_record_by_name,
            fetch_templates_by_gym,
            upsert_template_local,
            upsert_expense_local,
            upsert_branch_local,
            upsert_user_local,
            upsert_transaction_local,
            zk_connect,
            zk_disconnect,
            zk_start_service,
            zk_add_user,
            zk_stop_enrollment,
            zk_ping_device,
            zk_delete_user,
            is_app_running,
            kill_process_by_name_sysinfo,
            send_to_arduino,
            upsert_staff_attendance,
            open_browser,
            check_internet_command,
            play_sound,
            play_sound_test,
            load_config,
            get_logo_base64,
            push_to_extension,
            fp_start_service,
            start_whatsapp_engine,
            stop_whatsapp_engine,
            update_engine
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}


/// =====================================================================
/// Extra Commands — unchanged (sound, browser, internet check)
/// =====================================================================

#[tauri::command]
async fn open_browser(app: tauri::AppHandle, url: String) {
    app.shell().open(&url, None).expect("Failed to open URL");
}

#[tauri::command]
async fn check_internet_command(threshold_ms: u64) -> String {
    use tokio::time::{timeout, Instant};

    let url = "https://www.gstatic.com/generate_204";
    let start = Instant::now();

    let result = timeout(std::time::Duration::from_millis(threshold_ms), async {
        reqwest::get(url).await
    })
    .await;

    match result {
        Err(_) => "slow".into(),
        Ok(resp) => match resp {
            Ok(_) => {
                if start.elapsed().as_millis() > threshold_ms as u128 {
                    "slow".into()
                } else {
                    "online".into()
                }
            }
            Err(_) => "offline".into(),
        },
    }
}

#[tauri::command]
fn play_sound(status: String) -> Result<(), String> {
    let bytes: &[u8] = match status.as_str() {
        "Active" => include_bytes!("../sounds/active.wav"),
        "Birthday" => include_bytes!("../sounds/birthday.wav"),
        "Cancelled" => include_bytes!("../sounds/inactive.wav"),
        "Denied" => include_bytes!("../sounds/denied.wav"),
        _ => include_bytes!("../sounds/inactive.wav"),
    };

    let (stream, handle) = OutputStream::try_default().unwrap();
    let sink = Sink::try_new(&handle).unwrap();

    let source = rodio::Decoder::new(std::io::Cursor::new(bytes)).unwrap();
    sink.append(source);
    sink.sleep_until_end();

    drop(stream);
    Ok(())
}

#[tauri::command]
fn play_sound_test() -> Result<(), String> {
    use rodio::Source;

    let (_stream, handle) = OutputStream::try_default().map_err(|e| e.to_string())?;
    let sink = Sink::try_new(&handle).map_err(|e| e.to_string())?;

    let tone = rodio::source::SineWave::new(440.0).take_duration(std::time::Duration::from_secs(1));
    sink.append(tone);
    sink.sleep_until_end();

    Ok(())
}
