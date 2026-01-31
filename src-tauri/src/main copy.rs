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
use commands::arduino::send_to_arduino;
use commands::config::load_config;
mod utils; // ADD THIS
use tauri::AppHandle; 
use utils::ensure_user_asset; // IMPORT THIS
use commands::state::ZkProcessState;
use commands::config::*;

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

            let (mut write, mut read) = ws_stream.split();

            while let Some(Ok(msg)) = read.next().await {
                if !msg.is_text() {
                    continue;
                }

                let raw = msg.into_text().unwrap();
                println!("Received WS Message: {}", raw);

                let parsed: Result<IncomingQuery, _> = serde_json::from_str(&raw);

                match parsed {
                    Ok(req) => {
                        println!("-> Type: {}", req.r#type);
                        println!("-> SQL: {}", req.query);

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
                        if let Err(e) = write.send(Message::Text(json_response)).await {
                            eprintln!("Failed to send response: {:?}", e);
                        }
                    }

                    Err(err) => {
                        eprintln!("Invalid incoming message: {}", err);

                        let error_response = serde_json::json!({
                            "status": "error",
                            "error": "Invalid request format",
                            "raw": raw
                        });

                        let _ = write
                            .send(Message::Text(error_response.to_string()))
                            .await;
                    }
                }
            }

            println!("WebSocket disconnected");
        });
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

            // 🔥 Start WebSocket SQL server in background
            tauri::async_runtime::spawn(start_websocket_sql_server(app.handle().clone()));


            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                println!("Window is closing — running cleanup.");

                let app = window.app_handle().clone();

                tauri::async_runtime::spawn(async move {
                    let state = app.state::<ZkProcessState>();
                    if let Err(e) = zk_disconnect(state).await {
                        eprintln!("zk_disconnect failed: {:?}", e);
                    }
                });

                kill_process("ZKBridge.exe");
                kill_process("SecugenBridge.exe");
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
            get_logo_base64
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
