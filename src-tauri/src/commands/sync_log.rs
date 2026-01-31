use rusqlite::{params, OptionalExtension};
use tauri::State;
use chrono::Utc;
use crate::DbConnection;

/// ✅ Fetch the last sync timestamp for a table
#[tauri::command]
pub async fn get_sync_time(
    db: State<'_, DbConnection>,
    table_name: String,
) -> Result<Option<String>, String> {
    // Lock the database connection
    let conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("Database connection not available")?;

    // Validate table name
    if table_name.trim().is_empty() {
        return Err("Table name cannot be empty".into());
    }
    println!("SELECT last_synced_at FROM sync_log WHERE table_name ='{}'", table_name);
    let sql = "SELECT last_synced_at FROM sync_log WHERE table_name = ?1 LIMIT 1;";
    let result: Option<String> = conn
        .query_row(sql, params![table_name], |row| row.get(0))
        .optional()
        .map_err(|e| format!("Query error: {}", e))?;

    Ok(result)
}

/// ✅ Update or insert sync timestamp for a table
#[tauri::command]
pub async fn update_sync_time(
    db: State<'_, DbConnection>,
    table_name: String,
) -> Result<String, String> {
    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;

    if table_name.trim().is_empty() {
        return Err("Table name cannot be empty".into());
    }

    let now = Utc::now().to_rfc3339();

    // ✅ Upsert: insert if not exists, otherwise update
    let sql = "
        INSERT INTO sync_log (table_name, last_synced_at)
        VALUES (?1, ?2)
        ON CONFLICT(table_name) DO UPDATE SET last_synced_at = excluded.last_synced_at;
    ";

    conn.execute(sql, params![table_name, now])
        .map_err(|e| format!("Failed to update sync time: {}", e))?;

    Ok(format!("✅ Sync time updated for '{}': {}", table_name, now))
}
