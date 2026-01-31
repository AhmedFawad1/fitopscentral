use rusqlite::{params, Connection};
use serde_json::{json, Value};
use tauri::State;
use std::collections::HashMap;
use crate::DbConnection;

/// Fetch all dirty records from local tables to be synced with Supabase
#[tauri::command]
pub async fn fetch_dirty_records(db: State<'_, DbConnection>) -> Result<Value, String> {
    // acquire database connection
    let conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("Database connection not available")?;

    // Define tables with is_dirty column
    let dirty_tables = vec![
        "members_local",
        "memberships_local",
        "transactions_local",
        "staff_local",
    ];

    let mut results = serde_json::Map::new();

    for table in dirty_tables {
        let query = format!("SELECT * FROM {} WHERE is_dirty = 1 AND deleted = 0;", table);
        let mut stmt = conn
            .prepare(&query)
            .map_err(|e| format!("Error preparing query for {}: {}", table, e))?;

        // Get column names dynamically for each table
        let column_names: Vec<String> = stmt
            .column_names()
            .iter()
            .map(|name| name.to_string())
            .collect();

        let rows_iter = stmt
            .query_map([], |row| {
                let mut record = serde_json::Map::new();
                for (i, col_name) in column_names.iter().enumerate() {
                    let value: rusqlite::types::Value = row.get(i)?;
                    // Convert rusqlite::Value into JSON-compatible types
                    let json_value = match value {
                        rusqlite::types::Value::Null => Value::Null,
                        rusqlite::types::Value::Integer(i) => json!(i),
                        rusqlite::types::Value::Real(f) => json!(f),
                        rusqlite::types::Value::Text(t) => json!(t),
                        rusqlite::types::Value::Blob(b) => json!(base64::encode(b)),
                    };
                    record.insert(col_name.clone(), json_value);
                }
                Ok(Value::Object(record))
            })
            .map_err(|e| format!("Error reading {}: {}", table, e))?;

        let mut table_records = Vec::new();
        for row_result in rows_iter {
            if let Ok(row_value) = row_result {
                table_records.push(row_value);
            }
        }

        results.insert(table.to_string(), Value::Array(table_records));
    }

    Ok(Value::Object(results))
}
// Mark records as synced (is_dirty = 0) after successful sync
#[tauri::command]
pub async fn mark_records_as_synced(
    db: State<'_, DbConnection>,
    tableName: String,
    id: String,
) -> Result<(), String> {
    // acquire database connection
    let conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("Database connection not available")?;

    let query = format!(
        "UPDATE {} SET is_dirty = 0 WHERE id IN ({})",
        tableName, id
    );

    conn.execute(&query, params![])
        .map_err(|e| format!("Error updating records in {}: {}", tableName, e))?;

    Ok(())
}

#[tauri::command]
pub async fn mark_records_as_unsynced(
    db: State<'_, DbConnection>,
    tableName: String,
    id: String,
) -> Result<(), String> {
    // acquire database connection
    let conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("Database connection not available")?;

    let query = format!(
        "UPDATE {} SET is_dirty = 1 WHERE id IN ({})",
        tableName, id
    );

    conn.execute(&query, params![])
        .map_err(|e| format!("Error updating records in {}: {}", tableName, e))?;

    Ok(())
}
