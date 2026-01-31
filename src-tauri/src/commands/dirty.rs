use rusqlite::params;
use tauri::State;
use chrono::Utc;
use crate::DbConnection;

/// Marks a record as dirty or clean in the specified local table
#[tauri::command]
pub async fn mark_record_dirty(
    db: State<'_, DbConnection>,
    table_name: String,
    record_id: String,
    is_dirty: bool,
) -> Result<String, String> {
    // Lock database connection for write access
    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;

    // ✅ Validate input
    if table_name.trim().is_empty() {
        return Err("Table name cannot be empty".into());
    }

    // ✅ Sanitize table name to avoid SQL injection (only allow safe characters)
    if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_' ) {
        return Err(format!("Unsafe table name: {}", table_name));
    }

    // ✅ Prepare SQL dynamically (note: SQLite doesn’t support parameterizing table names)
    let sql = format!(
        "UPDATE {} 
         SET is_dirty = ?1, updated_at = ?2 
         WHERE id = ?3;",
        table_name
    );

    let now = Utc::now().to_rfc3339();

    // ✅ Execute update
    conn.execute(&sql, params![is_dirty as i32, now, record_id])
        .map_err(|e| format!("Failed to update record: {}", e))?;

    Ok(format!("✅ Record in '{}' marked as is_dirty = {}", table_name, is_dirty))
}

#[tauri::command]
pub async fn comment_table(
    db: State<'_, DbConnection>,
    table_name: String,
    record_id: String,
    comment: String,
) -> Result<String, String> {
    // Lock database connection for write access
    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;

    // ✅ Validate input
    if table_name.trim().is_empty() {
        return Err("Table name cannot be empty".into());
    }

    // ✅ Sanitize table name to avoid SQL injection (only allow safe characters)
    if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_' ) {
        return Err(format!("Unsafe table name: {}", table_name));
    }

    // ✅ Prepare SQL dynamically (note: SQLite doesn’t support parameterizing table names)
    let sql = format!(
        "UPDATE {} 
         SET comment = ?1, updated_at = ?2 
         WHERE id = ?3;",
        table_name
    );

    let now = Utc::now().to_rfc3339();

    // ✅ Execute update
    conn.execute(&sql, params![comment, now, record_id])
        .map_err(|e| format!("Failed to update record: {}", e))?;

    Ok(format!("✅ Record in '{}' updated with comment", table_name))
}
