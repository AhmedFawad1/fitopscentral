use futures_util::{StreamExt, SinkExt};
use serde_json::json;
use std::net::SocketAddr;
use tauri::State;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio::sync::Mutex as TokioMutex;
use std::sync::Arc;
use tokio_tungstenite::{accept_async, tungstenite::Message};

pub struct WsBroadcaster(pub broadcast::Sender<String>);

pub async fn start_ws_server(tx: broadcast::Sender<String>) {
    let addr: SocketAddr = "127.0.0.1:17895".parse().expect("Invalid WS bind address");
    let listener = TcpListener::bind(addr)
        .await
        .expect("Failed to bind WebSocket listener");

    println!("[WS] Listening on {}", addr);

    loop {
        match listener.accept().await {
            Ok((stream, peer)) => {
                println!("[WS] New client from {}", peer);
                let tx_clone = tx.clone();
                let mut rx = tx_clone.subscribe();

                tokio::spawn(async move {
                    let ws_stream = match accept_async(stream).await {
                        Ok(ws) => ws,
                        Err(e) => {
                            eprintln!("[WS] Handshake error: {}", e);
                            return;
                        }
                    };

                    let (write, mut read) = ws_stream.split();

                    // Wrap write in Arc<Mutex<..>> so it can be shared safely
                    let writer = Arc::new(TokioMutex::new(write));
                    let writer_clone = writer.clone();

                    // Task A: incoming broadcast messages from Rust → WebSocket client
                    let forward_task = tokio::spawn(async move {
                        loop {
                            match rx.recv().await {
                                Ok(payload) => {
                                    let mut w = writer_clone.lock().await;
                                    if w.send(Message::Text(payload)).await.is_err() {
                                        println!("[WS] Client disconnected (send error)");
                                        break;
                                    }
                                }
                                Err(_) => {
                                    break;
                                }
                            }
                        }
                    });

                    // Task B: messages from client → Rust (optional)
                    while let Some(msg) = read.next().await {
                        match msg {
                            Ok(Message::Text(txt)) => {
                                println!("[WS] From client: {}", txt);
                            }
                            Ok(Message::Close(_)) => {
                                println!("[WS] Client disconnected");
                                break;
                            }
                            Err(e) => {
                                eprintln!("[WS] Read error: {}", e);
                                break;
                            }
                            _ => {}
                        }
                    }

                    forward_task.abort();
                });
            }
            Err(e) => {
                eprintln!("[WS] Accept error: {}", e);
            }
        }
    }
}

/// Command: called by Next.js UI in Tauri to trigger WhatsApp message
#[tauri::command]
pub async fn send_whatsapp_message(
    phone: String,
    text: String,
    ws: State<'_, WsBroadcaster>,
) -> Result<(), String> {

    let payload = json!({
        "type": "sendMessage",
        "phone": phone,
        "text": text,
    })
    .to_string();

    match ws.0.send(payload) {
        Ok(_) => Ok(()),
        Err(_) => Err("Broadcast failed: no WebSocket clients connected".to_string()),
    }
}
