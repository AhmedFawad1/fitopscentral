use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use serde_json::Value;

use tokio::net::TcpStream;
use tokio::io::AsyncWriteExt;

use crate::commands::state::ZkProcessState;
use crate::SERVICE_STARTED;

// --------------------------------------------------
// Send command via persistent TCP stream
// --------------------------------------------------
pub async fn send_command(state: &ZkProcessState, json: String) -> Result<(), String> {
    let mut guard = state.stream.lock().await;

    let stream = guard.as_mut().ok_or("TCP stream not initialized")?;

    stream
        .write_all(json.as_bytes())
        .await
        .map_err(|e| e.to_string())?;

    stream
        .write_all(b"\n")
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// --------------------------------------------------
// Start the C# ZKBridge.exe and pipe events to UI
// --------------------------------------------------
async fn kill_existing_bridge(app: &AppHandle) -> Result<(), String> {
    // kill all instances (even duplicates)
    let _ = app.shell()
        .command("taskkill")
        .args(["/IM", "ZkBridge.exe", "/F"])
        .output()
        .await;

    // slight delay to allow Windows to update process table
    tokio::time::sleep(std::time::Duration::from_millis(300)).await;

    Ok(())
}


#[tauri::command]
pub async fn zk_start_service(
    app: AppHandle,
    state: tauri::State<'_, ZkProcessState>,
) -> Result<(), String> {

    let exe = r"resources/ZkBridge/ZkBridge.exe";
    let exe_name = "ZkBridge.exe";

    //-------------------------------------------------------
    // 1. KILL ANY EXISTING RUNNING INSTANCE OF ZkBridge.exe
    //-------------------------------------------------------
    {
        println!("Checking for existing ZkBridge.exe...");

        let list_result = app
            .shell()
            .command("tasklist")
            .args(["/FI", &format!("IMAGENAME eq {}", exe_name)])
            .output()
            .await
            .map_err(|e| format!("Failed process check: {}", e))?;

        let stdout = String::from_utf8_lossy(&list_result.stdout).to_string();

        if stdout.contains(exe_name) {
            println!("Existing instance found. Attempting to terminate...");

            app.shell()
                .command("taskkill")
                .args(["/IM", exe_name, "/F"])
                .output()
                .await
                .map_err(|e| format!("Failed to kill existing instance: {}", e))?;

            println!("Old instance terminated.");
        }
    }

    //-------------------------------------------------------
    // 2. ENSURE NO DOUBLE STARTS IN STATE FLAG
    //-------------------------------------------------------
    {
        let mut started_flag = state.started.lock().await;
        if *started_flag {
            println!("Start flag was set; resetting for fresh restart.");
        }
        *started_flag = true;
    }

    SERVICE_STARTED.set(true).ok();

    //-------------------------------------------------------
    // 3. START NEW INSTANCE OF ZkBridge.exe
    //-------------------------------------------------------
    let (mut rx, _child) = app
        .shell()
        .command(exe)
        .spawn()
        .map_err(|e| e.to_string())?;

    let app_clone = app.clone();

    // -----------------------------------------------------
    // 4. FORWARD STDOUT / STDERR TO UI
    // -----------------------------------------------------
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    let text = String::from_utf8_lossy(&bytes);

                    if let Ok(json) = serde_json::from_str::<Value>(&text) {
                        let _ = app_clone.emit("zk_event", json);
                    } else {
                        let _ = app_clone.emit("zk_event", serde_json::json!({
                            "type": "raw",
                            "data": text.to_string()
                        }));
                    }
                }

                CommandEvent::Stderr(bytes) => {
                    let text = String::from_utf8_lossy(&bytes);
                    let _ = app_clone.emit("zk_event", serde_json::json!({
                        "type": "stderr",
                        "data": text.to_string()
                    }));
                }

                CommandEvent::Terminated(code) => {
                    let _ = app_clone.emit("zk_event", serde_json::json!({
                        "type": "terminated",
                        "code": code
                    }));
                }

                _ => {}
            }
        }
    });

    //-------------------------------------------------------
    // 5. CONNECT TCP STREAM (ALWAYS FRESH)
    //-------------------------------------------------------
    match TcpStream::connect("127.0.0.1:15555").await {
        Ok(stream) => {
            let mut guard = state.stream.lock().await;
            *guard = Some(stream);
            println!("TCP stream connected and stored.");
        }
        Err(e) => {
            println!("TCP connect failed: {}", e);
            return Err(format!("Failed TCP connect: {}", e));
        }
    }

    Ok(())
}


// --------------------------------------------------
// Send CONNECT command
// --------------------------------------------------
#[tauri::command]
pub async fn zk_connect(
    state: tauri::State<'_, ZkProcessState>,
    ip: String,
    port: i32,
) -> Result<(), String> {

    let msg = serde_json::json!({
        "command": "connect",
        "args": { "ip": ip, "port": port }
    }).to_string();

    send_command(&state, msg).await
}

// --------------------------------------------------
// Send ADD USER command
// --------------------------------------------------
#[tauri::command]
pub async fn zk_add_user(
    state: tauri::State<'_, ZkProcessState>,
    id: String,
    name: String,
) -> Result<(), String> {

    let msg = serde_json::json!({
        "command": "add_user",
        "args": { "id": id, "name": name }
    }).to_string();

    send_command(&state, msg).await
}

// --------------------------------------------------
// 🚀 NEW COMMAND: STOP ENROLLMENT
// --------------------------------------------------
#[tauri::command]
pub async fn zk_stop_enrollment(
    state: tauri::State<'_, ZkProcessState>,
) -> Result<(), String> {

    let msg = serde_json::json!({
        "command": "stop_enrollment"
    }).to_string();

    send_command(&state, msg).await
}

#[tauri::command]
pub async fn zk_disconnect(
    state: tauri::State<'_, ZkProcessState>,
) -> Result<(), String> {

    let msg =  serde_json::json!({ 
        "command": "disconnect"
     }).to_string();

    send_command(&state, msg).await
}
#[tauri::command]
pub async fn zk_ping_device(
    state: tauri::State<'_, ZkProcessState>,
    ip: String,
    port: i32,
) -> Result<(), String> {

    let msg = serde_json::json!({
        "command": "ping"
    }).to_string();

    send_command(&state, msg).await
}



#[tauri::command]
pub async fn zk_delete_user(
    state: tauri::State<'_, ZkProcessState>,
    id: String,
) -> Result<(), String> {

    let msg = serde_json::json!({
        "command": "delete_user",
        "args": { "id": id }
    }).to_string();

    send_command(&state, msg).await
}

use sysinfo::{ProcessExt, System, SystemExt}; //

#[tauri::command]
pub fn is_app_running(app_name: String) -> bool {
    let sys = System::new_all();
    let mut found = false;

    // Iterate over all processes to find the correct name
    for (pid, process) in sys.processes() {
        // Print the process name and PID to your console for debugging
        //println!("PID: {}, Name: {}", pid, process.name());

        if process.name() == app_name {
            found = true;
            break; // Stop iterating once found
        }
    }

    found
}
#[tauri::command]
pub fn kill_process_by_name_sysinfo(name: &str) {
    let mut sys = System::new_all();
    sys.refresh_all();

    for process in sys.processes().values() {
        if process.name() == name {
            process.kill(); // Sends a SIGTERM signal
            // Or process.kill_with(sysinfo::Signal::Kill) for forceful termination (SIGKILL)
            println!("Killed process: {} (PID: {})", process.name(), process.pid());
            return; // Kill the first matching process found
        }
    }
    println!("No process found with the name: {}", name);
}