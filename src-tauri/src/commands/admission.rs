use rusqlite::{params, Connection, Transaction};
use serde::Deserialize;
use tauri::State;
use chrono::Utc;
use crate::DbConnection;

/// ---------- Data Models ----------

#[derive(Deserialize)]
pub struct MemberPayload {
    pub id: String,
    pub gym_id: String,
    pub branch_id: Option<String>,
    pub name: String,
    pub father_name: Option<String>,
    pub contact: Option<String>,
    pub email: Option<String>,
    pub gender: Option<String>,
    pub dob: Option<String>,
    pub address: Option<String>,
    pub admission_date: String,
    pub photo_url: Option<String>,
    pub updated_by: Option<String>,
    pub is_dirty: bool,
    pub serial_number: i64,
}

#[derive(Deserialize)]
pub struct MembershipPayload {
    pub id: String,
    pub gym_id: String,
    pub branch_id: Option<String>,
    pub member_id: String,
    pub package_id: Option<String>,
    pub trainer_id: Option<String>,
    pub start_date: String,
    pub due_date: String,
    pub cancellation_date: Option<String>,
    pub total_amount: i64,
    pub discount: i64,
    pub amount_paid: i64,
    pub balance: i64,
    pub admission_fee: bool,
    pub package_fee: bool,
    pub updated_by: Option<String>,
    pub is_dirty: bool,
    pub receipt_date: Option<String>,
    pub trainer_expiry: Option<String>,
    pub trainer_assigned_on: Option<String>,
    pub status: Option<String>,
    pub trainer_fee: Option<i64>,
}

#[derive(Deserialize)]
pub struct TransactionPayload {
    pub id: String,
    pub gym_id: String,
    pub branch_id: Option<String>,
    pub member_id: String,
    pub membership_id: String,
    pub txn_type: String, // e.g., "admission", "renewal", "payment"
    pub txn_date: String,
    pub amount: i64,
    pub payment_method: String,
    pub status: String, // e.g., "completed"
    pub updated_by: Option<String>,
    pub is_dirty: bool,
    pub expense_id: Option<String>,
}

/// ---------- Individual Insert Functions ----------

fn insert_member(tx: &Transaction, data: &MemberPayload) -> Result<(), rusqlite::Error> {
    let now = Utc::now().to_rfc3339();

    tx.execute(
        "INSERT OR REPLACE INTO members_local (
            id, gym_id, serial_number, branch_id, name, father_name, contact, email, gender, dob, address, 
            admission_date, photo_url, updated_at, updated_by, is_active, is_dirty, deleted
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 
            ?12, ?13, ?14, ?15,1, ?16, 0
        )",
        params![
            data.id,
            data.gym_id,
            data.serial_number,
            data.branch_id,
            data.name,
            data.father_name,
            data.contact,
            data.email,
            data.gender,
            data.dob,
            data.address,
            data.admission_date,
            data.photo_url,
            now,
            data.updated_by,
            data.is_dirty
        ],
    )?;
    Ok(())
}

fn insert_membership(tx: &Transaction, data: &MembershipPayload) -> Result<(), rusqlite::Error> {
    let now = Utc::now().to_rfc3339();

    tx.execute(
        "INSERT OR REPLACE INTO memberships_local (
            id, gym_id, branch_id, member_id, package_id, trainer_id, 
            start_date, due_date,cancellation_date, total_amount, discount, amount_paid,balance,
            admission_fee, package_fee, updated_at, status,
            receipt_date, trainer_expiry, trainer_assigned_on, is_dirty, deleted, trainer_fee, updated_by
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, 
            ?7, ?8, ?9, ?10, ?11, ?12, ?13,
             ?14, ?15, ?16,'active', 
             ?17, ?18, ?19, ?20, 0, ?21, ?22
        )",
        params![
            data.id,data.gym_id,data.branch_id,data.member_id,data.package_id,data.trainer_id,
            data.start_date,data.due_date,data.cancellation_date,data.total_amount,data.discount,data.amount_paid,data.balance,
            data.admission_fee,data.package_fee,now,
            data.receipt_date,data.trainer_expiry,data.trainer_assigned_on,data.is_dirty,data.trainer_fee,data.updated_by
        ],
    )?;
    Ok(())
}

fn insert_transaction(tx: &Transaction, data: &TransactionPayload) -> Result<(), rusqlite::Error> {
    let now = Utc::now().to_rfc3339();
    println!("Inserting transaction with ID: {}", data.txn_date);
    tx.execute(
        "INSERT OR REPLACE INTO transactions_local (
            id, gym_id, branch_id, member_id, membership_id, expense_id, txn_type, txn_date, 
            amount, payment_method, status, updated_at, updated_by, 
            is_dirty, deleted
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7,?8, 
            ?9, ?10, ?11, ?12,?13,
            ?14, 0
        )",
        params![
            data.id,
            data.gym_id,
            data.branch_id,
            data.member_id,
            data.membership_id,
            data.expense_id,
            data.txn_type,
            data.txn_date,
            data.amount,
            data.payment_method,
            data.status,
            now,
            data.updated_by,
            data.is_dirty,
        ],
    )?;
    Ok(())
}

/// ---------- Combined Insert Function ----------

#[derive(Deserialize)]
pub struct FullAdmissionPayload {
    pub member: MemberPayload,
    pub membership: MembershipPayload,
    pub transaction: TransactionPayload,
}

#[tauri::command]
pub async fn insert_full_admission(
    db: State<'_, DbConnection>,
    payload: FullAdmissionPayload,
) -> Result<String, String> {
    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;

    // ❗ NO if-let HERE because member is not Option
    let member_data = &payload.member;

    validate_member_uniqueness(
        conn,
        member_data.gym_id.as_str(),
        member_data.branch_id.as_deref().unwrap_or(""),
        member_data.serial_number,
        member_data.name.as_str(),
        member_data.contact.as_deref().unwrap_or(""),
    )?;

    let tx = conn.transaction().map_err(|e| format!("Begin tx error: {}", e))?;

    // Perform atomic inserts
    if let Err(e) = insert_member(&tx, &payload.member) {
        tx.rollback().ok();
        return Err(format!("Insert member failed: {}", e));
    }

    if let Err(e) = insert_membership(&tx, &payload.membership) {
        tx.rollback().ok();
        return Err(format!("Insert membership failed: {}", e));
    }

    if let Err(e) = insert_transaction(&tx, &payload.transaction) {
        tx.rollback().ok();
        return Err(format!("Insert transaction failed: {}", e));
    }

    tx.commit().map_err(|e| format!("Commit failed: {}", e))?;

    Ok("✅ Member, membership, and transaction inserted successfully.".into())
}

fn validate_member_uniqueness(
    conn: &rusqlite::Connection,
    gym_id: &str,
    branch_id: &str,
    serial_number: i64,
    name: &str,
    contact: &str,
) -> Result<(), String> {
    // 1️⃣ Check if serial number already exists for the gym
    let count_serial: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM members_local 
             WHERE gym_id = ?1 AND (branch_id = ?2 or branch_id is null) AND serial_number = ?3 AND deleted = 0",
            rusqlite::params![gym_id, branch_id, serial_number],
            |row| row.get(0),
        )
        .map_err(|e| format!("Serial number check failed: {}", e))?;

    if count_serial > 0 {
        return Err(format!(
            "A member with serial number {} already exists for this gym.",
            serial_number
        ));
    }

    // 2️⃣ Check if exact (name + contact) already exists
    let count_name_contact: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM members_local 
             WHERE gym_id = ?1 AND (branch_id = ?2 or branch_id is null) AND name = ?3 AND contact = ?4 AND deleted = 0",
            rusqlite::params![gym_id, branch_id, name, contact],
            |row| row.get(0),
        )
        .map_err(|e| format!("Duplicate name/contact check failed: {}", e))?;

    if count_name_contact > 0 {
        return Err(format!(
            "A member named '{}' with contact '{}' already exists.",
            name, contact
        ));
    }

    Ok(())
}
