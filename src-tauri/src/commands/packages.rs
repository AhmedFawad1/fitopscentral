use rusqlite::{params, ToSql};
use serde_json::{json, Value};
use tauri::State;
use crate::DbConnection;

#[tauri::command]
pub async fn fetch_packages(
    db: State<'_, DbConnection>,
    gym_id: String,
    branch_id: Option<String>,
) -> Result<Value, String> {
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection is not available")?;

    // ✅ Build dynamic query
    let (query, params): (&str, Vec<&dyn ToSql>) = if let Some(ref bid) = branch_id {
        (
            "SELECT gym_id, branch_id, id, name, duration, duration_type, cancellation, 
                    admission_fee, price, description, updated_at, synced_at, deleted
             FROM packages_local 
             WHERE gym_id = ?1 AND branch_id = ?2 AND deleted = 0;",
            vec![&gym_id as &dyn ToSql, bid as &dyn ToSql],
        )
    } else {
        (
            "SELECT gym_id, branch_id, id, name, duration, duration_type, cancellation, 
                    admission_fee, price, description, updated_at, synced_at, deleted
             FROM packages_local 
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

    // ✅ Collect rows into an array
    let mut packages = Vec::new();

    while let Some(row) = rows.next().map_err(|e| format!("❌ Row fetch failed: {}", e))? {
        let pkg = json!({
            "id": row.get::<_, String>("id").unwrap_or_default(),
            "gym_id": row.get::<_, String>("gym_id").unwrap_or_default(),
            "branch_id": row.get::<_, String>("branch_id").unwrap_or_default(),
            "name": row.get::<_, String>("name").unwrap_or_default(),
            "duration": row.get::<_, i64>("duration").unwrap_or(0),
            "duration_type": row.get::<_, String>("duration_type").unwrap_or_default(),
            "cancellation": row.get::<_, i64>("cancellation").unwrap_or(0),
            "admission_fee": row.get::<_, f64>("admission_fee").unwrap_or(0.0),
            "price": row.get::<_, f64>("price").unwrap_or(0.0),
            "description": row.get::<_, String>("description").unwrap_or_default(),
            "updated_at": row.get::<_, String>("updated_at").unwrap_or_default(),
            "synced_at": row.get::<_, String>("synced_at").unwrap_or_default(),
            "deleted": row.get::<_, bool>("deleted").unwrap_or(false)
        });

        packages.push(pkg);
    }

    Ok(Value::Array(packages))
}


#[tauri::command]
pub async fn upsert_package(
    db: State<'_, DbConnection>,
    package: Value,
) -> Result<Value, String> {
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection unavailable")?;
    println!("Upserting package: {:?}", package);
    let id = package.get("id").and_then(|v| v.as_str()).ok_or("❌ Missing 'id'")?;
    let gym_id = package.get("gym_id").and_then(|v| v.as_str()).ok_or("❌ Missing 'gym_id'")?;
    let branch_id = package.get("branch_id").and_then(|v| v.as_str()).unwrap_or("");
    let name = package.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let duration = package.get("duration").and_then(|v| v.as_i64()).unwrap_or(0);
    let duration_type = package.get("duration_type").and_then(|v| v.as_str()).unwrap_or("");
    let cancellation = package.get("cancellation").and_then(|v| v.as_i64()).unwrap_or(0);
    let admission_fee = package.get("admission_fee").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let price = package.get("price").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let description = package.get("description").and_then(|v| v.as_str()).unwrap_or("");
    let updated_at = package.get("updated_at").and_then(|v| v.as_str()).unwrap_or("");
    let synced_at = package.get("synced_at").and_then(|v| v.as_str()).unwrap_or("");
    let deleted = package.get("deleted").and_then(|v| v.as_bool()).unwrap_or(false);
    let is_dirty = package.get("is_dirty").and_then(|v| v.as_bool()).unwrap_or(false);
    conn.execute(
        "INSERT INTO packages_local (
            id, gym_id, branch_id, name, duration, duration_type, cancellation,
            admission_fee, price, description, updated_at, synced_at, deleted, is_dirty
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
         ON CONFLICT(id) DO UPDATE SET
            gym_id = excluded.gym_id,
            branch_id = excluded.branch_id,
            name = excluded.name,
            duration = excluded.duration,
            duration_type = excluded.duration_type,
            cancellation = excluded.cancellation,
            admission_fee = excluded.admission_fee,
            price = excluded.price,
            description = excluded.description,
            updated_at = excluded.updated_at,
            synced_at = excluded.synced_at,
            deleted = excluded.deleted,
            is_dirty = excluded.is_dirty;",
        params![
            id, gym_id, branch_id, name, duration, duration_type, cancellation,
            admission_fee, price, description, updated_at, synced_at, deleted, is_dirty
        ],
    )
    .map_err(|e| format!("❌ Failed to upsert package: {}", e))?;

    Ok(json!({
        "status": "success",
        "id": id,
        "message": format!("Package '{}' upserted successfully", name)
    }))
}

// delete package by id
#[tauri::command]
pub async fn delete_package(
    db: State<'_, DbConnection>,
    package_id: String,
    is_dirty: bool,
) -> Result<Value, String> {
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {}", e))?;
    let conn = conn_lock.as_ref().ok_or("❌ Database connection unavailable")?;
    // only set deleted to true instead of hard delete
    conn.execute(
        "UPDATE packages_local SET deleted = true, is_dirty = ?2 WHERE id = ?1;",
        params![package_id, is_dirty],
    )
    .map_err(|e| format!("❌ Failed to delete package: {}", e))?;

    Ok(json!({
        "status": "success",
        "id": package_id,
        "message": format!("Package with ID '{}' deleted successfully", package_id)
    }))
}
