use rusqlite::{Connection, Row};
use serde_json::{json, Value};
use tauri::State;
use crate::DbConnection;

/// ✅ Generic function to execute a SELECT query and return results as JSON
#[tauri::command]
pub async fn run_sqlite_query(
    db: State<'_, DbConnection>,
    query: String,
) -> Result<Value, String> {
    // 🔹 Acquire DB lock
    let conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("Database connection not available")?;

    // 🔹 Safety: Only allow SELECT-like queries (prevent write operations)
    // let q_trimmed = query.trim().to_lowercase();
    // if !(q_trimmed.starts_with("select") || q_trimmed.starts_with("with")) {
    //     return Err("❌ Only SELECT queries are allowed.".into());
    // }

    // 🔹 Prepare and execute
    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("SQL prepare error: {}", e))?;

    let column_names: Vec<String> = stmt.column_names().iter().map(|c| c.to_string()).collect();

    let rows = stmt
        .query_map([], |row| row_to_json(row, &column_names))
        .map_err(|e| format!("SQL execution error: {}", e))?;

    let mut results = Vec::new();
    for r in rows {
        if let Ok(obj) = r {
            results.push(obj);
        }
    }

    Ok(Value::Array(results))
}

/// ✅ Convert SQLite Row → JSON Object
fn row_to_json(row: &Row, columns: &[String]) -> rusqlite::Result<Value> {
    let mut obj = serde_json::Map::new();
    for (i, col_name) in columns.iter().enumerate() {
        let value: rusqlite::types::Value = row.get(i)?;
        let json_value = match value {
            rusqlite::types::Value::Null => Value::Null,
            rusqlite::types::Value::Integer(i) => json!(i),
            rusqlite::types::Value::Real(f) => json!(f),
            rusqlite::types::Value::Text(t) => json!(t),
            rusqlite::types::Value::Blob(b) => json!(base64::encode(b)),
        };
        obj.insert(col_name.clone(), json_value);
    }
    Ok(Value::Object(obj))
}
