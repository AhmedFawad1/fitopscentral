use rusqlite::{params, Connection, Transaction,Result, ToSql};
use serde::Deserialize;
use tauri::State;
use chrono::Utc;
use crate::DbConnection;

/// ---------- Data Models ----------
#[derive(Deserialize)]
pub struct BranchLocal {
    pub id: String,
    pub gym_id: String,
    pub name: String,
    pub code: String,
    pub address: String,
    pub is_main_branch: Option<bool>,
    pub updated_at: Option<String>,
    pub synced_at: Option<String>,
    pub deleted: bool,
}
#[derive(Debug)]
#[derive(Deserialize)]
pub struct UserLocal {
    pub id: String,
    pub gym_id: String,
    pub branch_id: Option<String>,
    pub user_id: Option<String>,
    pub name: Option<String>,
    pub role: Option<String>,
    pub email: Option<String>,
    pub is_active: Option<bool>,
    pub avatar_url: Option<String>,
    pub phone: Option<String>,
    pub updated_at: Option<String>,
    pub synced_at: Option<String>,
    pub deleted: bool,
}


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
    pub blocked: Option<bool>,
    pub biometric_data: Option<String>,
}

#[derive(Deserialize)]
pub struct MembershipPayload {
    pub id: String,
    pub gym_id: String,
    pub branch_id: Option<String>,
    pub member_id: String,
    pub package_id: Option<String>,
    pub trainer_id: Option<String>,
    pub trainer_expiry: Option<String>,
    pub trainer_assigned_on: Option<String>,
    pub start_date: String,
    pub due_date: String,
    pub cancellation_date: Option<String>,
    pub total_amount: i64,
    pub discount: i64,
    pub amount_paid: i64,
    pub admission_fee: bool,
    pub package_fee: bool,
    pub updated_by: Option<String>,
    pub is_dirty: bool,
    pub receipt_date: Option<String>,
    pub balance: i64,
    pub status: Option<String>,
    pub trainer_fee: Option<i64>,
}

#[derive(Deserialize)]
pub struct TransactionPayload {
    pub id: String,
    pub gym_id: String,
    pub branch_id: Option<String>,
    pub member_id: Option<String>,
    pub expense_id: Option<String>,
    pub membership_id: Option<String>,
    pub txn_type: String, // e.g. "admission", "renewal"
    pub txn_date: String,
    pub amount: i64,
    pub payment_method: Option<String>,
    pub status: Option<String>,
    pub updated_by: Option<String>,
    pub is_dirty: bool,
}

/// ---------- Individual Insert Helpers ----------

fn insert_member(tx: &Transaction, data: &MemberPayload) -> Result<(), rusqlite::Error> {
    let now = Utc::now().to_rfc3339();

    tx.execute(
        "INSERT OR REPLACE INTO members_local (
            id, gym_id, serial_number, branch_id, name, father_name, contact, email,
            gender, dob, address, admission_date, photo_url,
            updated_at, updated_by, is_active, is_dirty, deleted, blocked, biometric_data
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
            ?9, ?10, ?11, ?12, ?13,
            ?14, ?15, 1, ?16, 0, ?17, ?18
        )",
        params![
            data.id,             // ?1
            data.gym_id,         // ?2
            data.serial_number,  // ?3
            data.branch_id,      // ?4
            data.name,           // ?5
            data.father_name,    // ?6
            data.contact,        // ?7
            data.email,          // ?8
            data.gender,         // ?9
            data.dob,            // ?10
            data.address,        // ?11
            data.admission_date, // ?12
            data.photo_url,      // ?13
            now,                 // ?14 updated_at
            data.updated_by,     // ?15 updated_by  ✔ FIXED
            data.is_dirty,       // ?16 is_dirty ✔ FIXED
            data.blocked,         // ?17 blocked
            data.biometric_data // ?18 biometric_data
        ],
    )?;

    Ok(())
}

fn insert_membership(tx: &Transaction, data: &MembershipPayload) -> Result<(), rusqlite::Error> {
    let now = Utc::now().to_rfc3339();

    tx.execute(
        "INSERT OR REPLACE INTO memberships_local (
            id, gym_id, branch_id, member_id, package_id, trainer_id, trainer_expiry, trainer_assigned_on,
            start_date, due_date,cancellation_date, total_amount, discount, amount_paid, balance,
            admission_fee, package_fee, updated_at, updated_by, status,
            receipt_date, trainer_fee, is_dirty, deleted
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
            ?9, ?10, ?11, ?12, ?13, ?14, ?15,
            ?16, ?17, ?18, ?19,  ?20,
            ?21, ?22, ?23, ?24 
        )",
        params![
            data.id,data.gym_id,data.branch_id,data.member_id,data.package_id,data.trainer_id,data.trainer_expiry,data.trainer_assigned_on,
            data.start_date,data.due_date,data.cancellation_date,data.total_amount,data.discount,data.amount_paid,data.balance,
            data.admission_fee,data.package_fee,now,data.updated_by, data.status,
            data.receipt_date, data.trainer_fee, data.is_dirty, 0
        ],
    )?;
    Ok(())
}

fn insert_transaction(tx: &Transaction, data: &TransactionPayload) -> Result<(), rusqlite::Error> {
    let now = Utc::now().to_rfc3339();

    tx.execute(
        "INSERT OR REPLACE INTO transactions_local (
            id, gym_id, branch_id, member_id, membership_id, expense_id, txn_type, txn_date,
            amount, payment_method, status, updated_at, updated_by,
            is_dirty, deleted
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7,?8, 
            ?9, ?10, ?11, ?12,?13, 
            ?14,0
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
            data.is_dirty
        ],
    )?;
    Ok(())
}

/// ---------- Flexible Combined Insert ----------

#[derive(Deserialize)]
pub struct FlexibleAdmissionPayload {
    pub member: Option<MemberPayload>,
    pub membership: Option<MembershipPayload>,
    pub transaction: Option<TransactionPayload>,
}

#[tauri::command]
pub async fn insert_flexible_admission(
    db: State<'_, DbConnection>,
    payload: FlexibleAdmissionPayload,
) -> Result<String, String> {
    let mut conn_lock = db.0.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let conn = conn_lock.as_mut().ok_or("Database connection not available")?;
    // if let Some(ref member_data) = payload.member {
    //     validate_member_uniqueness(
    //         conn,
    //         member_data.gym_id.as_str(),                    // String
    //         member_data.serial_number,                      // i64
    //         member_data.name.as_str(),                      // String
    //         member_data.contact.as_deref().unwrap_or(""),   // Option<String>
    //         member_data.branch_id.as_deref().unwrap_or(""),
    //     )?;
    // }

    // Begin transaction only after validation success
    let tx = conn.transaction().map_err(|e| format!("Begin transaction failed: {}", e))?;

    // Insert only what is provided
    if let Some(ref member_data) = payload.member {
        insert_member(&tx, member_data).map_err(|e| format!("Insert member failed: {}", e))?;
    }

    if let Some(ref membership_data) = payload.membership {
        insert_membership(&tx, membership_data)
            .map_err(|e| format!("Insert membership failed: {}", e))?;
    }

    if let Some(ref txn_data) = payload.transaction {
        insert_transaction(&tx, txn_data)
            .map_err(|e| format!("Insert transaction failed: {}", e))?;
    }

    // Commit after all available inserts succeed
    tx.commit().map_err(|e| format!("Commit failed: {}", e))?;

    Ok("✅ Insert(s) completed successfully.".into())
}

fn validate_member_uniqueness(
    conn: &rusqlite::Connection,
    gym_id: &str,
    serial_number: i64,
    name: &str,
    contact: &str,
    branch_id: &str,
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
             WHERE name = ?1 AND contact = ?2 AND deleted = 0",
            rusqlite::params![name, contact],
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


#[tauri::command]
pub fn delete_record_by_name(
    db: State<'_, DbConnection>, 
    table_name: String,
    column_name: String,
    value: String,
) -> Result<usize, String> {
    // Validate identifiers
    if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err(format!("❌ Invalid table name: {}", table_name));
    }
    if !column_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err(format!("❌ Invalid column name: {}", column_name));
    }

    // Acquire DB connection
    let conn_lock = db.0.lock().map_err(|e| format!("❌ DB lock error: {e}"))?;
    let conn = conn_lock.as_ref().ok_or("❌ DB connection not available")?;

    // SQL
    let sql = format!("UPDATE {} SET deleted = 1 WHERE {} = ?1;", table_name, column_name);

    match conn.execute(&sql, params![value]) {
        Ok(rows) => Ok(rows),
        Err(e) => Err(format!("❌ Failed to delete record: {}", e)),
    }
}

#[tauri::command]
pub fn upsert_branch_local(
    state: State<DbConnection>,
    branch: BranchLocal,
) -> Result<(), String> {

    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("DB connection not initialized")?;

    conn.execute(
        r#"
        INSERT INTO branches_local (
            id,
            gym_id,
            name,
            code,
            address,
            is_main_branch,
            updated_at,
            synced_at,
            deleted
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6,
            COALESCE(?7, datetime('now')),
            ?8,
            ?9
        )
        ON CONFLICT(id) DO UPDATE SET
            gym_id         = excluded.gym_id,
            name           = excluded.name,
            code           = excluded.code,
            address        = excluded.address,
            is_main_branch = excluded.is_main_branch,
            updated_at     = COALESCE(excluded.updated_at, datetime('now')),
            synced_at      = excluded.synced_at,
            deleted        = excluded.deleted;
        "#,
        params![
            branch.id,
            branch.gym_id,
            branch.name,
            branch.code,
            branch.address,
            branch.is_main_branch,
            branch.updated_at,
            branch.synced_at,
            branch.deleted,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn upsert_user_local(
    state: State<DbConnection>,
    user: UserLocal,
) -> Result<(), String> {

    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("DB connection not initialized")?;

    conn.execute(
        r#"
        INSERT INTO users_local (
            id,
            gym_id,
            branch_id,
            user_id,
            name,
            role,
            email,
            is_active,
            avatar_url,
            phone,
            updated_at,
            synced_at,
            deleted
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6,
            ?7, ?8, ?9, ?10,
            COALESCE(?11, datetime('now')),
            ?12, ?13
        )
        ON CONFLICT(id) DO UPDATE SET
            gym_id      = excluded.gym_id,
            branch_id   = excluded.branch_id,
            user_id     = excluded.user_id,
            name        = excluded.name,
            role        = excluded.role,
            email       = excluded.email,
            is_active   = excluded.is_active,
            avatar_url  = excluded.avatar_url,
            phone       = excluded.phone,
            updated_at  = COALESCE(excluded.updated_at, datetime('now')),
            synced_at   = excluded.synced_at,
            deleted     = excluded.deleted;
        "#,
        params![
            user.id,          // ?1
            user.gym_id,      // ?2
            user.branch_id,   // ?3
            user.user_id,     // ?4
            user.name,        // ?5
            user.role,        // ?6
            user.email,       // ?7
            user.is_active,   // ?8
            user.avatar_url,  // ?9
            user.phone,       // ?10
            user.updated_at,  // ?11
            user.synced_at,   // ?12
            user.deleted      // ?13
        ]
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}


 /// debug print

#[tauri::command]
pub fn upsert_transaction_local(
    state: State<DbConnection>,
    txn: TransactionPayload,
) -> Result<(), String> {

    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("DB connection not initialized")?;

    conn.execute(
        r#"
        INSERT INTO transactions_local (
            id,
            gym_id,
            branch_id,
            member_id,
            membership_id,
            expense_id,
            txn_type,
            txn_date,
            amount,
            payment_method,
            status,
            updated_at,
            updated_by,
            synced_at,
            deleted,
            is_dirty,
            comment
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6,
            ?7, ?8, ?9, ?10, ?11,
            datetime('now'),  -- updated_at always refreshed
            ?12,               -- updated_by
            NULL,              -- synced_at always null for local inserts
            0,                 -- deleted: always false on upsert
            1,                 -- is_dirty: always mark dirty
            NULL               -- comment optional (future use)
        )
        ON CONFLICT(id) DO UPDATE SET
            gym_id        = excluded.gym_id,
            branch_id     = excluded.branch_id,
            member_id     = excluded.member_id,
            membership_id = excluded.membership_id,
            expense_id    = excluded.expense_id,
            txn_type      = excluded.txn_type,
            txn_date      = excluded.txn_date,
            amount        = excluded.amount,
            payment_method  = excluded.payment_method,
            status        = excluded.status,
            updated_at    = datetime('now'),
            updated_by    = excluded.updated_by,
            -- synced_at preserved unless overwritten by sync engine
            deleted       = deleted,
            is_dirty      = 1,
            comment       = excluded.comment;
        "#,
        params![
            txn.id,
            txn.gym_id,
            txn.branch_id,
            txn.member_id,
            txn.membership_id,
            txn.expense_id,
            txn.txn_type,
            txn.txn_date,
            txn.amount,
            txn.payment_method,
            txn.status,
            txn.updated_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
