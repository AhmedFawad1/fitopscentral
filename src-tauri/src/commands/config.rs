use tauri::{AppHandle, Manager, path::BaseDirectory};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use crate::utils::ensure_user_asset;

#[tauri::command]
pub async fn load_config(app: AppHandle) -> Result<Value, String> {
    let path = ensure_user_asset(&app, "app-config.json")?;

    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    Ok(json)
}



