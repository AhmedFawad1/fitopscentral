use rusqlite::{params, ToSql};
use serde_json::{json, Value};
use tauri::State;
use crate::DbConnection;

/// Fetch staff records (filtered by gym_id and optional branch_id)
#[tauri::command]
pub async fn fetch_staff(
    db: State<'_, DbConnection>,
    gym_id: String,
    branch_id: Option<String>,
) -> Result<Value, String> {
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection is not available")?;

    // Dynamic query
    let (query, params): (&str, Vec<&dyn ToSql>) = if let Some(ref bid) = branch_id {
        (
            "SELECT * FROM staff_local 
             WHERE gym_id = ?1 AND branch_id = ?2 AND deleted = 0;",
            vec![&gym_id as &dyn ToSql, bid as &dyn ToSql],
        )
    } else {
        (
            "SELECT * FROM staff_local 
             WHERE gym_id = ?1 AND deleted = 0;",
            vec![&gym_id as &dyn ToSql],
        )
    };

    let mut stmt = conn
        .prepare(query)
        .map_err(|e| format!("❌ Failed to prepare query: {}", e))?;
    let mut rows = stmt
        .query(&*params)
        .map_err(|e| format!("❌ Query failed: {}", e))?;

    let mut staff_list = Vec::new();

    while let Some(row) = rows.next().map_err(|e| format!("❌ Row fetch failed: {}", e))? {
        let staff = json!({
            "id": row.get::<_, String>("id").unwrap_or_default(),
            "gym_id": row.get::<_, String>("gym_id").unwrap_or_default(),
            "branch_id": row.get::<_, String>("branch_id").unwrap_or_default(),
            "user_id": row.get::<_, String>("user_id").unwrap_or_default(),
            "name": row.get::<_, String>("name").unwrap_or_default(),
            "contact": row.get::<_, String>("contact").unwrap_or_default(),
            "address": row.get::<_, String>("address").unwrap_or_default(),
            "email": row.get::<_, String>("email").unwrap_or_default(),
            "role_title": row.get::<_, String>("role_title").unwrap_or_default(),
            "join_date": row.get::<_, String>("join_date").unwrap_or_default(),
            "salary_type": row.get::<_, String>("salary_type").unwrap_or_default(),
            "base_salary": row.get::<_, i64>("base_salary").unwrap_or(0),
            "hourly_rate": row.get::<_, i64>("hourly_rate").unwrap_or(0),
            "commission_percent": row.get::<_, i64>("commission_percent").unwrap_or(0),
            "work_start_time": row.get::<_, String>("work_start_time").unwrap_or_default(),
            "work_end_time": row.get::<_, String>("work_end_time").unwrap_or_default(),
            "is_active": row.get::<_, bool>("is_active").unwrap_or(false),
            "updated_at": row.get::<_, String>("updated_at").unwrap_or_default(),
            "created_at": row.get::<_, String>("created_at").unwrap_or_default(),
            "synced_at": row.get::<_, String>("synced_at").unwrap_or_default(),
            "is_dirty": row.get::<_, bool>("is_dirty").unwrap_or(false),
            "deleted": row.get::<_, bool>("deleted").unwrap_or(false),
            "fee": row.get::<_, i64>("fee").unwrap_or(0),
            "staff_type": row.get::<_, String>("staff_type").unwrap_or_default(),
            "nic": row.get::<_, String>("nic").unwrap_or_default(),
            "status": row.get::<_, String>("status").unwrap_or_default(),
        });
        staff_list.push(staff);
    }

    Ok(Value::Array(staff_list))
}

/// Insert or update staff record
#[tauri::command]
pub async fn upsert_staff(
    db: State<'_, DbConnection>,
    staff: Value,
) -> Result<Value, String> {
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection unavailable")?;

    let id = staff.get("id").and_then(|v| v.as_str()).ok_or("❌ Missing 'id'")?;
    let gym_id = staff.get("gym_id").and_then(|v| v.as_str()).ok_or("❌ Missing 'gym_id'")?;
    let branch_id = staff.get("branch_id").and_then(|v| v.as_str()).unwrap_or("");
    let user_id = staff.get("user_id").and_then(|v| v.as_str()).unwrap_or("");
    let name = staff.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let contact = staff.get("contact").and_then(|v| v.as_str()).unwrap_or("");
    let address = staff.get("address").and_then(|v| v.as_str()).unwrap_or("");
    let email = staff.get("email").and_then(|v| v.as_str()).unwrap_or("");
    let role_title = staff.get("role_title").and_then(|v| v.as_str()).unwrap_or("");
    let join_date = staff.get("join_date").and_then(|v| v.as_str()).unwrap_or("");
    let salary_type = staff.get("salary_type").and_then(|v| v.as_str()).unwrap_or("");
    let base_salary = staff.get("base_salary").and_then(|v| v.as_i64()).unwrap_or(0);
    let hourly_rate = staff.get("hourly_rate").and_then(|v| v.as_i64()).unwrap_or(0);
    let commission_percent = staff.get("commission_percent").and_then(|v| v.as_i64()).unwrap_or(0);
    let work_start_time = staff.get("work_start_time").and_then(|v| v.as_str()).unwrap_or("");
    let work_end_time = staff.get("work_end_time").and_then(|v| v.as_str()).unwrap_or("");
    let is_active = staff.get("is_active").and_then(|v| v.as_bool()).unwrap_or(false);
    let updated_at = staff.get("updated_at").and_then(|v| v.as_str()).unwrap_or("");
    let created_at = staff.get("created_at").and_then(|v| v.as_str()).unwrap_or("");
    let synced_at = staff.get("synced_at").and_then(|v| v.as_str()).unwrap_or("");
    let is_dirty = staff.get("is_dirty").and_then(|v| v.as_bool()).unwrap_or(false);
    let deleted = staff.get("deleted").and_then(|v| v.as_bool()).unwrap_or(false);
    let fee = staff.get("fee").and_then(|v| v.as_i64()).unwrap_or(0);
    let staff_type = staff.get("staff_type").and_then(|v| v.as_str()).unwrap_or("regular");
    let nic = staff.get("nic").and_then(|v| v.as_str()).unwrap_or("");
    let status = staff.get("status").and_then(|v| v.as_str()).unwrap_or("");
    let serial_number = staff.get("serial_number").and_then(|v| v.as_i64()).unwrap_or(0);
    let updated_by = staff.get("updated_by").and_then(|v| v.as_str()).unwrap_or("");
    conn.execute(
        "INSERT INTO staff_local (
            id, gym_id, branch_id, user_id, name, contact, address, email, role_title, join_date,
            salary_type, base_salary, hourly_rate, commission_percent, work_start_time, work_end_time,
            is_active, updated_at, created_at, synced_at, is_dirty, deleted, fee, staff_type, nic, status, serial_number, updated_by
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16,
                ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28)
        ON CONFLICT(id) DO UPDATE SET
            gym_id = excluded.gym_id,
            branch_id = excluded.branch_id,
            user_id = excluded.user_id,
            name = excluded.name,
            contact = excluded.contact,
            address = excluded.address,
            email = excluded.email,
            role_title = excluded.role_title,
            join_date = excluded.join_date,
            salary_type = excluded.salary_type,
            base_salary = excluded.base_salary,
            hourly_rate = excluded.hourly_rate,
            commission_percent = excluded.commission_percent,
            work_start_time = excluded.work_start_time,
            work_end_time = excluded.work_end_time,
            is_active = excluded.is_active,
            updated_at = excluded.updated_at,
            created_at = excluded.created_at,
            synced_at = excluded.synced_at,
            is_dirty = excluded.is_dirty,
            deleted = excluded.deleted,
            fee = excluded.fee,
            staff_type = excluded.staff_type,
            nic = excluded.nic,
            status = excluded.status,
            serial_number = excluded.serial_number,
            updated_by = excluded.updated_by;",
        params![
            id, gym_id, branch_id, user_id, name, contact, address, email, role_title, join_date,
            salary_type, base_salary, hourly_rate, commission_percent, work_start_time, work_end_time,
            is_active, updated_at, created_at, synced_at, is_dirty, deleted, fee, staff_type, nic, status, serial_number, updated_by
        ],
    )
    .map_err(|e| format!("❌ Failed to upsert staff: {}", e))?;

    Ok(json!({
        "status": "success",
        "id": id,
        "message": format!("Staff '{}' upserted successfully", name)
    }))
}

/// Soft delete staff record
#[tauri::command]
pub async fn delete_staff(
    db: State<'_, DbConnection>,
    staff_id: String,
    is_dirty: bool,
) -> Result<Value, String> {
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection unavailable")?;

    conn.execute(
        "UPDATE staff_local 
         SET deleted = true, is_dirty = ?2 
         WHERE id = ?1;",
        params![staff_id, is_dirty],
    )
    .map_err(|e| format!("❌ Failed to delete staff: {}", e))?;

    Ok(json!({
        "status": "success",
        "id": staff_id,
        "message": format!("Staff member with ID '{}' deleted successfully", staff_id)
    }))
}
