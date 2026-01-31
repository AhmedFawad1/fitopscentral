use serde_json::json;
use std::io::{self, Write, Read};
use byteorder::{LittleEndian, WriteBytesExt};
use tauri::command;

/// Chrome Native Messaging bridge
#[command]
pub fn send_to_extension(phone: String, text: String) -> Result<String, String> {
    // Build JSON message
    let msg = json!({
        "command": "sendMessage",
        "phone": phone,
        "text": text
    });

    // Store the string in a real variable so the bytes reference is valid
    let msg_string = msg.to_string();
    let msg_bytes = msg_string.as_bytes();

    let mut stdout = io::stdout();

    // Write 4-byte length
    stdout
        .write_u32::<LittleEndian>(msg_bytes.len() as u32)
        .map_err(|e| format!("Failed to write length: {}", e))?;

    // Write JSON bytes
    stdout
        .write_all(msg_bytes)
        .map_err(|e| format!("Failed to write body: {}", e))?;

    stdout.flush().map_err(|e| format!("Flush error: {}", e))?;

    // ===== Read response =====
    let mut stdin = io::stdin();
    let mut len_buf = [0u8; 4];

    stdin
        .read_exact(&mut len_buf)
        .map_err(|e| format!("Failed reading response length: {}", e))?;

    let resp_len = u32::from_le_bytes(len_buf);
    let mut resp_buf = vec![0u8; resp_len as usize];

    stdin
        .read_exact(&mut resp_buf)
        .map_err(|e| format!("Failed reading response body: {}", e))?;

    let response = String::from_utf8_lossy(&resp_buf).to_string();
    Ok(response)
}
