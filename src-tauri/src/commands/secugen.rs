use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use serde_json::Value;

//
// Simple state container – no flags inside to avoid lifetime issues
//
use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri_plugin_shell::process::CommandChild;

#[derive(Default)]
pub struct FpState {
    pub child: Arc<Mutex<Option<CommandChild>>>,
}

//
// ---------------------------------------------------------------
// RESET STATE (currently a no-op; safe to call on page refresh)
// ---------------------------------------------------------------
#[tauri::command]
pub async fn fp_reset_state(_state: tauri::State<'_, FpState>) -> Result<(), String> {
    // You can add logging or external bookkeeping here if needed
    println!("fp_reset_state called (no-op).");
    Ok(())
}

//
// ---------------------------------------------------------------
// START SERVICE (mode = 0 verify, mode = 1 base64)
// ---------------------------------------------------------------
#[tauri::command]
pub async fn fp_start_service(
    app: AppHandle,
    _state: tauri::State<'_, FpState>,
    mode: i32,
) -> Result<(), String>
{
    // Path inside your Tauri resources
    let exe_path = r"resources/SecugenBridge/SecuGenDemo.exe";
    // Process name as seen by Windows
    let process_name = "SecuGenDemo.exe";

    // 1) Kill anything already running
    kill_existing_process(&_state).await?;


    println!("Starting SecuGenDemo.exe with mode = {}", mode);

    // 2) Start new process with desired mode arg
    let (mut rx, child) = app
        .shell()
        .command(exe_path)
        .args([mode.to_string()])
        .spawn()
        .map_err(|e| e.to_string())?;

    {
        let mut lock = _state.child.lock().await;
        *lock = Some(child);
    }


    let app_clone = app.clone();
    let _ = app_clone.emit(
        "fp_ready",
        serde_json::json!({ "status": "ready" })
    );

    // 3) Listen for output and forward to frontend via "fp_event"
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    let text = String::from_utf8_lossy(&bytes).trim().to_string();

                    if text.is_empty() {
                        continue;
                    }

                    // If C# prints clean JSON lines, parse them
                    if let Ok(json) = serde_json::from_str::<Value>(&text) {
                        let _ = app_clone.emit("fp_event", json);
                    } else {
                        // Otherwise wrap as a raw log line
                        let _ = app_clone.emit(
                            "fp_event",
                            serde_json::json!({
                                "type": "raw",
                                "data": text
                            }),
                        );
                    }
                }

                CommandEvent::Stderr(bytes) => {
                    let _ = app_clone.emit(
                        "fp_event",
                        serde_json::json!({
                            "type": "stderr",
                            "data": String::from_utf8_lossy(&bytes)
                        }),
                    );
                }

                CommandEvent::Terminated(status) => {
                    println!("SecuGenDemo.exe terminated: {:?}", status);

                    let _ = app_clone.emit(
                        "fp_event",
                        serde_json::json!({
                            "type": "terminated",
                            "data": format!("process ended: {:?}", status)
                        }),
                    );
                }

                _ => {}
            }
        }
    });

    Ok(())
}

//
// ---------------------------------------------------------------
// CHANGE MODE (restart EXE with new mode)
// ---------------------------------------------------------------
#[tauri::command]
pub async fn fp_send_mode(
    app: AppHandle,
    state: tauri::State<'_, FpState>,
    mode: i32,
) -> Result<(), String>
{
    println!("fp_send_mode → {}", mode);
    // Just restart the service with a new mode
    fp_start_service(app, state, mode).await
}

//
// ---------------------------------------------------------------
// KILL EXISTING EXE (Graceful "close" + force kill)
// ---------------------------------------------------------------
async fn kill_existing_process(
    state: &tauri::State<'_, FpState>,
) -> Result<(), String> {

    let mut lock = state.child.lock().await;

    if let Some(mut child) = lock.take() {
        // Ask process to exit gracefully
        let _ = child.write(b"close\n");

        // Give C# time to run SafeCloseDevice()
        tokio::time::sleep(std::time::Duration::from_millis(600)).await;

        // If still alive, terminate as last resort
        let _ = child.kill();
    }

    Ok(())
}

