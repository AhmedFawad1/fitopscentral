use tauri::{AppHandle, path::BaseDirectory, Manager};  // <-- Manager added
use std::{fs, path::PathBuf};

pub fn ensure_user_asset(app: &AppHandle, filename: &str) -> Result<PathBuf, String> {
    // Path where user can modify
    let target_path = app
        .path()
        .resolve(filename, BaseDirectory::AppLocalData)
        .map_err(|e| e.to_string())?;

    // Make directory if needed
    if let Some(parent) = target_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    // If missing → copy default from bundled resources
    if !target_path.exists() {
        let bundled_path = app
            .path()
            .resolve(&format!("resources/{}", filename), BaseDirectory::Resource)
            .map_err(|e| e.to_string())?;

        fs::copy(&bundled_path, &target_path)
            .map_err(|e| format!("Failed to copy {}: {}", filename, e))?;
    }

    Ok(target_path)
}
