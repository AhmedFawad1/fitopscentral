use serde::{Deserialize, Serialize};
use rusqlite::{params, Row};
use tauri::State;

use crate::DbConnection;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TemplateLocal {
    pub gym_id: String,
    pub branch_id: Option<String>,
    pub id: String,
    pub name: String,
    pub content: String,
    pub updated_at: Option<String>,
    pub synced_at: Option<String>,
    pub deleted: bool,
    pub r#type: String, // `type` is a Rust keyword, so use r#type
    pub is_dirty: Option<bool>,
}

fn map_template_row(row: &Row) -> rusqlite::Result<TemplateLocal> {
    Ok(TemplateLocal {
        gym_id: row.get(0)?,
        branch_id: row.get(1)?,
        id: row.get(2)?,
        name: row.get(3)?,
        content: row.get(4)?,
        updated_at: row.get(5)?,
        synced_at: row.get(6)?,
        deleted: row.get::<_, Option<bool>>(7)?.unwrap_or(false),
        r#type: row.get(8)?,
        is_dirty: row.get::<_, Option<bool>>(9)?,
    })
}

#[tauri::command]
pub fn fetch_templates_by_gym(
    state: State<DbConnection>,
    gym_id: String,
) -> Result<Vec<TemplateLocal>, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("DB connection not initialized")?;

    let mut stmt = conn
        .prepare(
            r#"
            SELECT
                gym_id,
                branch_id,
                id,
                name,
                content,
                updated_at,
                synced_at,
                deleted,
                type
            FROM templates_local
            WHERE gym_id = ?1
              AND (deleted IS NULL OR deleted = 0)
            ORDER BY name COLLATE NOCASE
            "#,
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![gym_id], map_template_row)
        .map_err(|e| e.to_string())?;

    let mut templates = Vec::new();
    for t in rows {
        templates.push(t.map_err(|e| e.to_string())?);
    }

    Ok(templates)
}

#[tauri::command]
pub fn upsert_template_local(
    state: State<DbConnection>,
    template: TemplateLocal,
) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("DB connection not initialized")?;

    conn.execute(
        r#"
        INSERT INTO templates_local (
            gym_id,
            branch_id,
            id,
            name,
            content,
            updated_at,
            synced_at,
            deleted,
            type,
            is_dirty
        ) VALUES (?1, ?2, ?3, ?4, ?5, COALESCE(?6, datetime('now')), ?7, ?8, ?9, ?10)
        ON CONFLICT(id) DO UPDATE SET
            gym_id    = excluded.gym_id,
            branch_id = excluded.branch_id,
            name      = excluded.name,
            content   = excluded.content,
            updated_at= excluded.updated_at,
            synced_at = excluded.synced_at,
            deleted   = excluded.deleted,
            type      = excluded.type,
            is_dirty  = excluded.is_dirty
        "#,
        params![
            template.gym_id,
            template.branch_id,
            template.id,
            template.name,
            template.content,
            template.updated_at,
            template.synced_at,
            template.deleted,
            template.r#type,
            template.is_dirty,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
