use tauri::State;
use rusqlite::{params, ToSql, OptionalExtension}; // ✅ Add OptionalExtension here
use serde_json::{json, Value};
use crate::DbConnection;

/// Fetch user access information from user_access_view_local
#[tauri::command]
pub async fn fetch_user_access_view(
    db: State<'_, DbConnection>,
    user_id: String,
) -> Result<Value, String> {
    // Acquire database connection safely
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection is not available")?;

    // Query user access view
    let mut stmt = conn
        .prepare(
            "SELECT 
                user_id,
                full_name,
                email,
                role,
                gym_id,
                gym_name,
                owner_user_id,
                gemail,
                gcode,
                bcode,
                branch_id,
                branch_name,
                access_scope,
                visible_members_count,
                accessible_branches,
                all_packages_json,
                all_staff_json,
                all_templates_json ,
                all_branches_json,
                all_users_json
            FROM user_access_view_local
            WHERE user_id = ?1;"
        )
        .map_err(|e| format!("❌ Prepare failed: {}", e))?;

    let user_access: Option<Value> = stmt
        .query_row(params![user_id], |row| {
            Ok(json!({
                "user_id": row.get::<_, String>(0)?,
                "full_name": row.get::<_, Option<String>>(1)?,
                "email": row.get::<_, Option<String>>(2)?,
                "role": row.get::<_, Option<String>>(3)?,
                "gym_id": row.get::<_, Option<String>>(4)?,
                "gym_name": row.get::<_, Option<String>>(5)?,
                "owner_user_id": row.get::<_, Option<String>>(6)?,
                "gemail": row.get::<_, Option<String>>(7)?,
                "gcode": row.get::<_, Option<String>>(8)?,
                "bcode": row.get::<_, Option<String>>(9)?,
                "branch_id": row.get::<_, Option<String>>(10)?,
                "branch_name": row.get::<_, Option<String>>(11)?,
                "access_scope": row.get::<_, Option<String>>(12)?,
                "visible_members_count": row.get::<_, Option<i64>>(13)?,
                "accessible_branches": row.get::<_, Option<String>>(14)?,
                "all_packages_json": row.get::<_, Option<String>>(15)?
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or(json!([])),
                "all_staff_json": row.get::<_, Option<String>>(16)?
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or(json!([])),
                "all_templates_json": row.get::<_, Option<String>>(17)?
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or(json!([])),
                "all_branches_json": row.get::<_, Option<String>>(18)?
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or(json!([])),
                "all_users_json": row.get::<_, Option<String>>(19)?
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or(json!([]))
            }))
        })
        .optional()
        .map_err(|e| format!("❌ Query failed: {}", e))?;

    // Return JSON object or default message
    Ok(user_access.unwrap_or_else(|| json!({"message": "User not found"})))
}
