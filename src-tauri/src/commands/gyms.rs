// --- Standard & external crates ---
use std::time::Duration;

// --- SQLite ---
use rusqlite::{params, Connection, OptionalExtension, ToSql, types::ValueRef, Row};

// --- JSON ---
use serde_json::{json, Value};
// --- HTTP Client ---
use reqwest::Client;

// --- Time utilities ---
use chrono::{DateTime, SecondsFormat};

// --- Tauri ---
use tauri::State;

// --- Bring shared app state from main.rs ---
use crate::DbConnection;
/// Simple test command
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// Command to upsert gyms, branches and users
#[tauri::command]
pub async fn sync_gym_data(
    db: State<'_, DbConnection>,
    userData: Value,
) -> Result<Value, String> {

    let conn_lock = db.0.lock().map_err(|e| format!("❌ Failed to acquire DB lock: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection is not available")?;

    // ✅ Extract and convert fields
    let id = userData.get("gym_id")
        .and_then(|v| v.as_str())
        .ok_or("❌ gym_id is missing")?;

    let gym_name = userData.get("gym_name").and_then(|v| v.as_str()).unwrap_or_default();
    let gym_email = userData.get("gemail").and_then(|v| v.as_str()).unwrap_or_default();
    let code = userData.get("gcode").and_then(|v| v.as_str()).unwrap_or_default();
    let owner_user_id = userData.get("owner_user_id").and_then(|v| v.as_str()).unwrap_or_default();
    // ✅ Upsert logic
    conn.execute(
        "INSERT INTO gyms_local (id, name, email, code, owner_user_id)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id)
         DO UPDATE SET name=excluded.name, email=excluded.email, code=excluded.code, owner_user_id=excluded.owner_user_id",
        params![id, gym_name, gym_email, code, owner_user_id],
    ).map_err(|e| format!("❌ Failed to upsert gym: {}", e))?;

    // upsert branches
    let branch_id = userData.get("branch_id").and_then(|v| v.as_str()).unwrap_or_default();
    if !branch_id.is_empty() {
        let branch_name = userData.get("branch_name").and_then(|v| v.as_str()).unwrap_or_default();
        let code = userData.get("bcode").and_then(|v| v.as_str()).unwrap_or_default();
        conn.execute(
            "INSERT INTO branches_local (id, gym_id, name, code)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(id)
             DO UPDATE SET gym_id=excluded.gym_id, name=excluded.name, code=excluded.code",
            params![branch_id, id, branch_name, code],
        ).map_err(|e| format!("❌ Failed to upsert branch: {}", e))?;
    }
    // upsert users
    let user_id = userData.get("user_id").and_then(|v| v.as_str()).unwrap_or_default();
    if !user_id.is_empty() {
        let name = userData.get("uname").and_then(|v| v.as_str()).unwrap_or_default();
        let email = userData.get("uemail").and_then(|v| v.as_str()).unwrap_or_default();
        let branch_id = userData.get("branch_id").and_then(|v| v.as_str()).unwrap_or_default();
        let role = userData.get("role").and_then(|v| v.as_str()).unwrap_or_default();
        conn.execute(
            "INSERT INTO users_local (id, gym_id, branch_id, name, email, role)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id)
             DO UPDATE SET gym_id=excluded.gym_id, branch_id=excluded.branch_id, name=excluded.name, email=excluded.email, role=excluded.role",
            params![user_id, id, branch_id, name, email, role],
        ).map_err(|e| format!("❌ Failed to upsert user: {}", e))?;
    }
    Ok(json!({"status": "success"}))
}
// select * from gym_dashboard_view or branch_dashboard_view depending on if branch_id is present;
// return the JSON result


#[tauri::command]
pub async fn fetch_gym_dashboard(
    db: State<'_, DbConnection>,
    gym_id: String,
    branch_id: Option<String>,
) -> Result<Value, String> {
    let conn_lock = db.0.lock().map_err(|e| format!("❌ Failed to acquire DB lock: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection is not available")?;
    println!("Fetching dashboard data for gym_id: {}, branch_id: {:?}", gym_id, branch_id);
    // ✅ Build query and parameters
    let (query, params): (&str, Vec<&dyn ToSql>) = if let Some(ref branch_id) = branch_id {
        (
            "SELECT * FROM branch_dashboard_view WHERE gym_id = ?1 AND branch_id = ?2",
            vec![&gym_id as &dyn ToSql, branch_id as &dyn ToSql],
        )
    } else {
        (
            "SELECT * FROM gym_dashboard_view WHERE gym_id = ?1",
            vec![&gym_id as &dyn ToSql],
        )
    };

    let mut stmt = conn
        .prepare(query)
        .map_err(|e| format!("❌ Failed to prepare statement: {}", e))?;

    // ✅ Get column names correctly
    let column_names: Vec<String> = stmt
        .column_names()
        .iter()
        .map(|c| c.to_string())
        .collect();

    let mut results: Vec<Value> = Vec::new();
    let mut rows = stmt
        .query(&*params)
        .map_err(|e| format!("❌ Query execution failed: {}", e))?;

    // ✅ Convert each row to JSON
    while let Some(row) = rows
        .next()
        .map_err(|e| format!("❌ Failed to fetch row: {}", e))?
    {
        let mut obj = serde_json::Map::new();

        for (i, col_name) in column_names.iter().enumerate() {
            let val_ref = row.get_ref_unwrap(i);
            let json_val: Value = match val_ref {
                ValueRef::Null => Value::Null,
                ValueRef::Integer(v) => json!(v),
                ValueRef::Real(v) => json!(v),
                ValueRef::Text(v) => {
                    let s = std::str::from_utf8(v)
                        .map_err(|e| format!("❌ UTF-8 error in '{}': {}", col_name, e))?;
                    json!(s)
                }
                ValueRef::Blob(_) => Value::Null, // optional blob handling
            };
            obj.insert(col_name.clone(), json_val);
        }

        results.push(Value::Object(obj));
    }

    Ok(Value::Array(results))
}
