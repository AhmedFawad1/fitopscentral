use serde::{Serialize, Deserialize};
use rusqlite::{params};
use tauri::State;
use crate::DbConnection;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExpenseLocal {
    pub gym_id: String,
    pub branch_id: String,
    pub id: String,
    pub amount: i64,
    pub txn_date: String,
    pub category: String,
    pub description: String,
    pub payment_method: String,
    pub updated_at: Option<String>,
    pub synced_at: Option<String>,
    pub deleted: bool,
    pub name: String,
    pub is_recurring: bool,
    pub paid_to: Option<String>,
    pub recurrence_interval: Option<i64>,
    pub is_dirty: bool,
}

#[tauri::command]
pub fn upsert_expense_local(
    state: State<DbConnection>,
    expense: ExpenseLocal,
) -> Result<(), String> {

    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("DB connection not initialized")?;

    conn.execute(
        r#"
        INSERT INTO expenses_local (
            gym_id,
            branch_id,
            id,
            amount,
            txn_date,
            category,
            description,
            payment_method,
            updated_at,
            synced_at,
            deleted,
            name,
            is_recurring,
            paid_to,
            recurrence_interval,
            is_dirty
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
            COALESCE(?9, datetime('now')),  -- Auto update timestamp
            ?10,
            ?11,
            ?12,
            ?13,
            ?14,
            ?15,
            ?16
        )
        ON CONFLICT(id) DO UPDATE SET
            gym_id       = excluded.gym_id,
            branch_id    = excluded.branch_id,
            id           = excluded.id,
            amount       = excluded.amount,
            txn_date = excluded.txn_date,
            category     = excluded.category,
            description  = excluded.description,
            payment_method = excluded.payment_method,
            updated_at   = COALESCE(excluded.updated_at, datetime('now')),
            synced_at    = excluded.synced_at,
            deleted      = excluded.deleted,
            name         = excluded.name,
            is_recurring = excluded.is_recurring,
            paid_to      = excluded.paid_to,
            recurrence_interval = excluded.recurrence_interval,
            is_dirty     = excluded.is_dirty
        "#,
        params![
            expense.gym_id,
            expense.branch_id,
            expense.id,
            expense.amount,
            expense.txn_date,
            expense.category,
            expense.description,
            expense.payment_method,
            expense.updated_at,
            expense.synced_at,
            expense.deleted,
            expense.name,
            expense.is_recurring,
            expense.paid_to,
            expense.recurrence_interval,
            expense.is_dirty
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
