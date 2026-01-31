use rusqlite::{params, Connection};
use serde_json::Value;
use tauri::State;
use chrono::Utc;
use crate::DbConnection;

/// ✅ Generic Upsert Function with Schema Validation + Sync Log Update
#[tauri::command]
pub async fn upsert_local_records(
    db: State<'_, DbConnection>,
    table_name: String,
    table_data: Value,
) -> Result<String, String> {
    // 🔹 Lock database connection
    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;

    // 🔹 Validate table name safety
    if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_' ) {
        return Err(format!("Unsafe table name: {}", table_name));
    }

    // 🔹 Ensure input is a JSON object
    let obj = table_data.as_object().ok_or("tableData must be a JSON object")?;

    // 🔹 Fetch valid column names for table
    let valid_columns = get_table_columns(conn, &table_name)?;

    // ✅ Filter only valid keys present in DB schema
    let mut filtered_data = serde_json::Map::new();
    for (key, val) in obj {
        if valid_columns.contains(key) {
            filtered_data.insert(key.clone(), val.clone());
        }
    }

    // ✅ Add/override updated_at
    let now = Utc::now().to_rfc3339();
    filtered_data.insert("updated_at".into(), Value::String(now.clone()));

    // ✅ If table has is_dirty, mark as clean
    if valid_columns.iter().any(|c| c == "is_dirty") {
        filtered_data.insert("is_dirty".into(), Value::Number(0.into()));
    }

    // ✅ Prepare columns and placeholders
    let columns: Vec<String> = filtered_data.keys().cloned().collect();
    let placeholders: Vec<String> = vec!["?".to_string(); columns.len()];
    let values: Vec<Value> = filtered_data.values().cloned().collect();

    // ✅ Build SQL dynamically
    let sql = format!(
        "INSERT OR REPLACE INTO {} ({}) VALUES ({});",
        table_name,
        columns.join(", "),
        placeholders.join(", ")
    );

    // ✅ Convert serde_json::Value to SQLite parameters
    let params_vec: Vec<_> = values
        .iter()
        .map(|v| match v {
            Value::Null => rusqlite::types::Value::Null,
            Value::Bool(b) => rusqlite::types::Value::Integer(if *b { 1 } else { 0 }),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    rusqlite::types::Value::Integer(i)
                } else if let Some(f) = n.as_f64() {
                    rusqlite::types::Value::Real(f)
                } else {
                    rusqlite::types::Value::Text(n.to_string())
                }
            }
            Value::String(s) => rusqlite::types::Value::Text(s.clone()),
            other => rusqlite::types::Value::Text(other.to_string()),
        })
        .collect();

    // ✅ Execute upsert
    conn.execute(&sql, rusqlite::params_from_iter(params_vec))
        .map_err(|e| format!("Upsert failed: {}", e))?;

    // ✅ Update sync_log time
    update_sync_log_time(conn, &table_name)?;

    Ok(format!(
        "✅ Upserted 1 record into '{}' ({} valid columns) and updated sync time.",
        table_name,
        columns.len()
    ))
}

/// ✅ Retrieve valid column names for a given table
fn get_table_columns(conn: &Connection, table_name: &str) -> Result<Vec<String>, String> {
    let pragma_sql = format!("PRAGMA table_info({})", table_name);
    let mut stmt = conn.prepare(&pragma_sql).map_err(|e| format!("PRAGMA failed: {}", e))?;
    let mut rows = stmt.query([]).map_err(|e| format!("Query failed: {}", e))?;

    let mut columns = Vec::new();
    while let Some(row) = rows.next().map_err(|e| format!("Row read error: {}", e))? {
        let name: String = row.get(1).unwrap_or_default();
        columns.push(name);
    }
    Ok(columns)
}

/// ✅ Internal helper: upsert into sync_log
fn update_sync_log_time(conn: &mut Connection, table_name: &str) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let sql = "
        INSERT INTO sync_log (table_name, last_synced_at)
        VALUES (?1, ?2)
        ON CONFLICT(table_name)
        DO UPDATE SET last_synced_at = excluded.last_synced_at;
    ";

    conn.execute(sql, params![table_name, now])
        .map_err(|e| format!("Failed to update sync_log: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn upsert_attendance(
    db: State<'_, DbConnection>,
    gym_id: String,
    branch_id: Option<String>,
    serial_number: String,
    date: String,
    time: String,
) -> Result<String, String> {

    use rusqlite::Error as SqErr;

    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;

    let now = chrono::Utc::now().to_rfc3339();

    // 🔥 Normalize branch_id BEFORE using it
    let branch_id = branch_id.unwrap_or_else(|| "".to_string());

    // ----------------------------
    // Try to fetch existing row
    // ----------------------------
    let existing = {
        let mut stmt = conn.prepare(
            "SELECT id, check_in_time, check_out_time
             FROM attendance_local 
             WHERE gym_id=?1 AND branch_id=?2 AND serial_number=?3 
             AND date=?4 AND deleted IS NOT TRUE"
        ).map_err(|e| e.to_string())?;

        match stmt.query_row(
            rusqlite::params![gym_id, branch_id, serial_number, date],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, Option<String>>(1)?,
                    row.get::<_, Option<String>>(2)?,
                ))
            },
        ) {
            Ok(row) => Some(row),
            Err(SqErr::QueryReturnedNoRows) => None,
            Err(e) => return Err(e.to_string()),
        }
    };

    // ----------------------------
    // INSERT if no row exists
    // ----------------------------
    if existing.is_none() {
        let new_id = uuid::Uuid::new_v4().to_string();

        conn.execute(
            "INSERT INTO attendance_local 
                (id, gym_id, branch_id, serial_number, date, check_in_time, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                new_id,
                gym_id,
                branch_id,   // ← use normalized value
                serial_number,
                date,
                time,
                now
            ],
        )
        .map_err(|e| e.to_string())?;

        return Ok(format!("CHECK_IN added (id={})", new_id));
    }

    // ----------------------------
    // UPDATE if exists
    // ----------------------------
    let (id, check_in, check_out) = existing.unwrap();

    if check_in.is_some() && check_out.is_none() {
        conn.execute(
            "UPDATE attendance_local 
             SET check_out_time=?, updated_at=? 
             WHERE id=?",
            rusqlite::params![time, now, id],
        )
        .map_err(|e| e.to_string())?;

        return Ok(format!("CHECK_OUT updated (id={})", id));
    }

    conn.execute(
        "UPDATE attendance_local 
         SET check_out_time=?, updated_at=? 
         WHERE id=?",
        rusqlite::params![time, now, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(format!("CHECK_OUT overwritten (id={})", id))
}

#[tauri::command]
pub fn upsert_staff_attendance(
    db: State<'_, DbConnection>,
    gym_id: String,
    branch_id: Option<String>,
    staff_id: String,
    date: String,
    check_in_time: Option<String>,
    check_out_time: Option<String>,
) -> Result<String, String> {

    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;

    let now = chrono::Utc::now().to_rfc3339();

    // 🔥 Normalize branch_id BEFORE using it
    let branch_id = branch_id.unwrap_or_else(|| "".to_string());

    // ----------------------------
    // Try to fetch existing row
    // ----------------------------
    let existing = {
        let mut stmt = conn.prepare(
            "SELECT id
             FROM staff_attendance_local 
             WHERE gym_id=?1 AND branch_id=?2 AND staff_id=?3 
             AND date=?4 AND deleted IS NOT TRUE"
        ).map_err(|e| e.to_string())?;

        match stmt.query_row(
            rusqlite::params![gym_id, branch_id, staff_id, date],
            |row| row.get::<_, String>(0),
        ) {
            Ok(row) => Some(row),
            Err(rusqlite::Error::QueryReturnedNoRows) => None,
            Err(e) => return Err(e.to_string()),
        }
    };

    // ----------------------------
    // INSERT if no row exists
    // ----------------------------
    if existing.is_none() {
        let new_id = uuid::Uuid::new_v4().to_string();

        conn.execute(
            "INSERT INTO staff_attendance_local 
                (id, gym_id, branch_id, staff_id, date, check_in_time, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                new_id,
                gym_id,
                branch_id,   // ← use normalized value
                staff_id,
                date,
                check_in_time,
                now
            ],
        )
        .map_err(|e| e.to_string())?;

        return Ok(format!("Staff attendance added (id={})", new_id));
    }

    // ----------------------------
    // UPDATE if exists
    let id = existing.unwrap();
    conn.execute(
        "UPDATE staff_attendance_local 
         SET
             check_out_time=COALESCE(?1, check_out_time)
         WHERE id=?2",
        rusqlite::params![check_out_time, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(format!("Staff attendance updated (id={})", id))
}

