--  F:\Fitopscentral\gym-app> sqlite3 sqlite/local_gym.db ".read sqlite/schema.sql"
-- 🔹 Gyms (minimal metadata for license verification)
drop table gyms_local;drop table branches_local;drop table users_local;drop table members_local;drop table transactions_local;drop table memberships_local;drop view gym_dashboard_view;drop view branch_dashboard_view;
CREATE TABLE IF NOT EXISTS  gyms_local (
  id              TEXT PRIMARY KEY,
  owner_user_id   TEXT,
  name            TEXT,
  email           TEXT,
  contact         TEXT,
  code            TEXT,
  is_active       BOOLEAN,
  updated_at      TEXT,
  synced_at       TEXT,
  deleted         BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS  branches_local (
  id              TEXT PRIMARY KEY,
  gym_id          TEXT NOT NULL,
  name            TEXT,
  code            TEXT,
  address         TEXT,
  is_main_branch  BOOLEAN,
  updated_at      TEXT,
  synced_at       TEXT,
  deleted         BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS users_local (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  branch_id TEXT,
  name TEXT,
  role TEXT,
  email TEXT,
  is_active BOOLEAN,
  avatar_url TEXT,
  phone TEXT,
  updated_at TEXT,
  synced_at TEXT,
  deleted BOOLEAN DEFAULT FALSE
);


CREATE TABLE IF NOT EXISTS  members_local (
  id              TEXT PRIMARY KEY,
  serial_number   INTEGER,
  biometric_data  TEXT,
  gym_id          TEXT,
  branch_id       TEXT,
  member_code     TEXT,
  name            TEXT,
  father_name     TEXT,
  contact         TEXT,
  email           TEXT,
  gender          TEXT,
  dob             TEXT,
  address         TEXT,
  admission_date  TEXT,
  photo_url       TEXT,
  is_active       BOOLEAN,
  updated_at      TEXT,
  synced_at       TEXT,
  updated_by      TEXT,
  deleted         BOOLEAN DEFAULT FALSE,
  is_dirty        BOOLEAN DEFAULT FALSE,
  comment         TEXT
);

CREATE TABLE IF NOT EXISTS  memberships_local (
  gym_id          TEXT,
  branch_id       TEXT,
  member_id       TEXT,
  id              TEXT PRIMARY KEY,
  status          TEXT,
  package_id      TEXT,
  trainer_id      TEXT,
  trainer_expiry  TEXT,
  trainer_assigned_on TEXT,
  receipt_date   TEXT,
  start_date      TEXT,
  due_date        TEXT,
  cancellation_date TEXT,
  balance         INTEGER,
  total_amount    INTEGER,
  trainer_fee    INTEGER,
  discount        INTEGER,
  amount_paid     INTEGER,
  admission_fee   BOOLEAN DEFAULT FALSE,
  package_fee     BOOLEAN DEFAULT FALSE,
  updated_at      TEXT,
  synced_at       TEXT,
  updated_by      TEXT,
  is_dirty        BOOLEAN DEFAULT FALSE,
  deleted         BOOLEAN DEFAULT FALSE,
  comment         TEXT
);

CREATE TABLE IF NOT EXISTS  transactions_local (
  gym_id          TEXT,
  branch_id       TEXT,
  member_id       TEXT,
  membership_id   TEXT,
  expense_id      TEXT,
  id              TEXT PRIMARY KEY,
  txn_type        TEXT,
  txn_date        TEXT,
  amount          INTEGER,
  payment_method    TEXT,
  status          TEXT,
  updated_at      TEXT,
  updated_by      TEXT,
  synced_at       TEXT,
  deleted         BOOLEAN DEFAULT FALSE,
  is_dirty        BOOLEAN DEFAULT FALSE,
  comment         TEXT
);

CREATE TABLE IF NOT EXISTS packages_local (
  gym_id          TEXT,
  branch_id       TEXT,
  id              TEXT PRIMARY KEY,
  name            TEXT,
  duration        INTEGER,
  duration_type   TEXT,
  cancellation    INTEGER,
  admission_fee   REAL,
  price           REAL,
  description     TEXT,
  updated_at      TEXT,
  synced_at       TEXT,
  deleted         BOOLEAN DEFAULT FALSE,
  comment         TEXT,
  is_dirty         BOOLEAN 
);

CREATE TABLE IF NOT EXISTS templates_local (
    gym_id          TEXT,
    branch_id       TEXT,
    id              TEXT PRIMARY KEY,
    name            TEXT,
    content         TEXT,
    updated_at      TEXT,
    synced_at       TEXT,
    deleted         BOOLEAN DEFAULT FALSE,
    type            TEXT,
    is_dirty        BOOLEAN DEFAULT FALSE
);

DROP TABLE IF EXISTS staff_local;
CREATE TABLE IF NOT EXISTS staff_local (
    gym_id          TEXT,
    branch_id       TEXT,
    user_id        TEXT,
    id              TEXT PRIMARY KEY,
    serial_number   INTEGER,
    name            TEXT,
    contact         TEXT,
    address         TEXT,
    email           TEXT,
    role_title      TEXT,
    join_date       TEXT,
    salary_type    TEXT,
    base_salary     INTEGER,
    hourly_rate     INTEGER,
    commission_percent REAL,
    work_start_time TEXT,
    work_end_time   TEXT,
    is_active       BOOLEAN,
    updated_at      TEXT,
    created_at      TEXT,
    synced_at       TEXT,
    is_dirty        BOOLEAN DEFAULT FALSE,
    deleted         BOOLEAN DEFAULT FALSE,
    fee            INTEGER DEFAULT 0,
    staff_type     TEXT DEFAULT 'regular',
    nic           TEXT,
    status         TEXT,
    comment        TEXT,
    updated_by     TEXT
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT,
  last_synced_at TEXT
);

DROP VIEW IF EXISTS user_access_view_local;

CREATE VIEW user_access_view_local AS
SELECT
    u.id AS user_id,
    u.name AS full_name,
    u.email AS email,
    u.role AS role,
    u.gym_id AS gym_id,
    g.name AS gym_name,
    g.owner_user_id AS owner_user_id,
    g.email AS gemail,
    g.code AS gcode,
    b.code AS bcode,
    u.branch_id AS branch_id,
    b.name AS branch_name,

    CASE 
        WHEN u.role = 'owner' THEN 'all'
        WHEN u.role = 'manager' THEN 'branch'
        ELSE 'self'
    END AS access_scope,

    -- 🧮 Visible members count
    COUNT(DISTINCT m.id) AS visible_members_count,

    -- 🧮 Accessible branches (as JSON array)
    CASE 
        WHEN u.role IN ('owner', 'manager') THEN
            json_group_array(DISTINCT b2.name)
        ELSE 
            json('[]')
    END AS accessible_branches,

    -- 📦 All packages for that gym (JSON array)
    (
        SELECT json_group_array(
            json_object(
                'id', p.id,
                'name', p.name,
                'duration', p.duration,
                'duration_type', p.duration_type,
                'admission_fee', p.admission_fee,
                'price', p.price,
                'cancellation', p.cancellation,
                'branch_id', p.branch_id
            )
        )
        FROM packages_local p
        WHERE p.gym_id = u.gym_id
        AND (
            u.branch_id IS NULL
            OR u.branch_id = ''
            OR p.branch_id = u.branch_id
          )
    ) AS all_packages_json,

    -- 👥 All staff for that gym (JSON array)
    (
        SELECT json_group_array(
            json_object(
                'id', s.id,
                'name', s.name,
                'contact', s.contact,
                'address', s.address,
                'email', s.email,
                'fee', s.fee,
                'commission_percent', s.commission_percent,
                'base_salary', s.base_salary,
                'nic', s.nic,
                'staff_type', s.staff_type,
                'status', s.status,
                'branch_id', s.branch_id,
                'work_start_time', s.work_start_time,
                'work_end_time', s.work_end_time,
                'salary_type', s.salary_type,
                'hourly_rate', s.hourly_rate,
                'serial_number', s.serial_number
            )
        )
        FROM staff_local s
        WHERE s.gym_id = u.gym_id
          AND s.deleted = 0
    ) AS all_staff_json,
    (
        SELECT json_group_array(
            json_object(
                'id', t.id,
                'name', t.name,
                'content', t.content,
                'type', t.type
            )
        )
        FROM templates_local t
        WHERE t.gym_id = u.gym_id
          AND t.deleted = 0
    ) AS all_templates_json,
    (
        SELECT json_group_array(
            json_object(
                'id', b.id,
                'name', b.name,
                'address', b.address,
                'code', b.code
            )
        )
        FROM branches_local b
        WHERE b.gym_id = u.gym_id
          AND b.deleted = 0
    ) AS all_branches_json,
    (
        SELECT json_group_array(
            json_object(
                'id', u2.id,
                'name', u2.name,
                'branch_id', u2.branch_id,
                'role', u2.role,
                'email', u2.email
            )
        )
        FROM users_local u2
        WHERE u2.gym_id = u.gym_id
          AND u2.deleted = 0
    ) AS all_users_json

FROM users_local u
JOIN gyms_local g 
  ON g.id = u.gym_id
LEFT JOIN branches_local b 
  ON b.id = u.branch_id
LEFT JOIN members_local m 
  ON m.gym_id = u.gym_id
  AND (
        u.role = 'owner'
        OR (u.role = 'manager' AND m.branch_id = u.branch_id)
        OR (u.role NOT IN ('owner','manager'))
    )
LEFT JOIN branches_local b2 
  ON b2.gym_id = u.gym_id
GROUP BY 
    u.id, u.name, u.email, u.role, u.gym_id,u.branch_id,
    g.name, g.owner_user_id, g.email, g.code,
    b.code, u.branch_id, b.name,u.branch_id;

-- old view
DROP VIEW IF EXISTS gym_dashboard_view;

CREATE VIEW gym_dashboard_view AS
WITH latest_membership AS (
    SELECT *
    FROM (
        SELECT
            ms.*,
            ROW_NUMBER() OVER (
                PARTITION BY ms.member_id
                ORDER BY date(ms.receipt_date) DESC
            ) AS rn
        FROM memberships_local ms
        WHERE ms.deleted = 0
    )
    WHERE rn = 1
),

member_metrics AS (
    SELECT
        m.gym_id,
        m.branch_id,
        m.id AS member_id,
        lm.status,
        lm.due_date,
        lm.cancellation_date,
        lm.balance,
        lm.receipt_date,              -- ✅ added back
        m.dob
    FROM members_local m
    LEFT JOIN latest_membership lm ON lm.member_id = m.id
    WHERE m.deleted = 0
),

branch_agg AS (
    SELECT
        gym_id,
        branch_id,

        COUNT(member_id) AS total_members,

        SUM(CASE WHEN status='active' AND date(due_date) > date('now')
                 THEN 1 ELSE 0 END) AS active_members,

        SUM(CASE WHEN status='active' AND date(due_date)<=date('now')
                 AND (cancellation_date IS NULL OR date(cancellation_date)>date('now'))
                 THEN 1 ELSE 0 END) AS inactive_members,

        SUM(CASE WHEN cancellation_date IS NOT NULL
                 AND date(cancellation_date)<=date('now')
                 THEN 1 ELSE 0 END) AS cancelled_members,

        SUM(CASE WHEN strftime('%m-%d', dob)=strftime('%m-%d','now')
                 THEN 1 ELSE 0 END) AS birthdays_today,

        SUM(CASE WHEN date(due_date)=date('now') THEN 1 ELSE 0 END) AS due_today,
        SUM(CASE WHEN date(due_date)=date('now','+1 day') THEN 1 ELSE 0 END) AS due_tomorrow,

        SUM(CASE WHEN date(cancellation_date)=date('now') THEN 1 ELSE 0 END) AS cancelled_today,
        SUM(CASE WHEN date(cancellation_date)=date('now','+1 day') THEN 1 ELSE 0 END) AS cancelled_tomorrow,

        -- ✅ balance for current month (same logic as you had earlier)
        SUM(
            CASE
                WHEN receipt_date IS NOT NULL
                     AND strftime('%Y-%m', receipt_date) = strftime('%Y-%m','now')
                THEN balance
                ELSE 0
            END
        ) AS balance_month
    FROM member_metrics
    GROUP BY gym_id, branch_id
),

txn_agg AS (
    SELECT
        gym_id,
        branch_id,

        SUM(CASE WHEN txn_type IN ('admission','renewal','payment')
                     AND status='completed'
                     AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                 THEN amount ELSE 0 END) AS collection_month,

        SUM(CASE WHEN txn_type='refund' THEN amount ELSE 0 END) AS refund_month,

        SUM(CASE WHEN txn_type='admission'
                     AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                 THEN 1 ELSE 0 END) AS admissions_month,

        SUM(CASE WHEN txn_type='renewal'
                     AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                 THEN 1 ELSE 0 END) AS renewals_month,

        SUM(CASE WHEN txn_type='admission' AND date(txn_date)=date('now')
                 THEN 1 ELSE 0 END) AS admissions_today,

        SUM(CASE WHEN txn_type='renewal' AND date(txn_date)=date('now')
                 THEN 1 ELSE 0 END) AS renewals_today,

        SUM(CASE WHEN txn_type IN ('admission','renewal','payment')
                     AND date(txn_date)=date('now')
                 THEN amount ELSE 0 END) AS collection_today
    FROM transactions_local
    WHERE deleted = 0
    GROUP BY gym_id, branch_id
),

expense_agg AS (
    SELECT
        gym_id,
        branch_id,
        SUM(amount) AS expenses_month
    FROM transactions_local
    WHERE txn_type='expense'
      AND deleted = 0
      AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
    GROUP BY gym_id, branch_id
),

-- ░░ Branch rows with all metrics
branch_rows AS (
    SELECT
        g.id AS gym_id,
        bl.id AS branch_id,

        COALESCE(ba.total_members, 0) AS total_members,
        COALESCE(ba.active_members, 0) AS active_members,
        COALESCE(ba.inactive_members, 0) AS inactive_members,
        COALESCE(ba.cancelled_members, 0) AS cancelled_members,
        COALESCE(ba.birthdays_today, 0) AS birthdays_today,

        COALESCE(tx.collection_month, 0) AS collection_month,
        COALESCE(tx.refund_month, 0) AS refund_month,
        COALESCE(tx.admissions_month, 0) AS admissions_month,
        COALESCE(tx.renewals_month, 0) AS renewals_month,
        COALESCE(tx.admissions_today, 0) AS admissions_today,
        COALESCE(tx.renewals_today, 0) AS renewals_today,
        COALESCE(tx.collection_today, 0) AS collection_today,

        COALESCE(exp.expenses_month, 0) AS expenses_month,

        COALESCE(ba.due_today, 0) AS due_today,
        COALESCE(ba.due_tomorrow, 0) AS due_tomorrow,
        COALESCE(ba.cancelled_today, 0) AS cancelled_today,
        COALESCE(ba.cancelled_tomorrow, 0) AS cancelled_tomorrow,

        COALESCE(ba.balance_month, 0) AS balance_month      -- ✅ exposed here
    FROM gyms_local g
    JOIN branches_local bl ON bl.gym_id = g.id AND bl.deleted = 0
    LEFT JOIN branch_agg ba ON ba.gym_id = g.id AND ba.branch_id = bl.id
    LEFT JOIN txn_agg tx ON tx.gym_id = g.id AND tx.branch_id = bl.id
    LEFT JOIN expense_agg exp ON exp.gym_id = g.id AND exp.branch_id = bl.id
),

-- ░░ Whole-gym row = SUM of all branches
gym_rows AS (
    SELECT
        gym_id,
        NULL AS branch_id,

        SUM(total_members) AS total_members,
        SUM(active_members) AS active_members,
        SUM(inactive_members) AS inactive_members,
        SUM(cancelled_members) AS cancelled_members,
        SUM(birthdays_today) AS birthdays_today,

        SUM(collection_month) AS collection_month,
        SUM(refund_month) AS refund_month,
        SUM(admissions_month) AS admissions_month,
        SUM(renewals_month) AS renewals_month,
        SUM(admissions_today) AS admissions_today,
        SUM(renewals_today) AS renewals_today,
        SUM(collection_today) AS collection_today,

        SUM(expenses_month) AS expenses_month,

        SUM(due_today) AS due_today,
        SUM(due_tomorrow) AS due_tomorrow,
        SUM(cancelled_today) AS cancelled_today,
        SUM(cancelled_tomorrow) AS cancelled_tomorrow,

        SUM(balance_month) AS balance_month          -- ✅ whole-gym monthly balance
    FROM branch_rows
    GROUP BY gym_id
)

-- FINAL RESULT
SELECT * FROM gym_rows
UNION ALL
SELECT * FROM branch_rows;

-- new view 
DROP VIEW IF EXISTS gym_dashboard_view;

CREATE VIEW gym_dashboard_view AS
WITH latest_membership AS (
    SELECT *
    FROM (
        SELECT
            ms.*,
            ROW_NUMBER() OVER (
                PARTITION BY ms.member_id
                ORDER BY date(ms.receipt_date) DESC
            ) AS rn
        FROM memberships_local ms
        WHERE ms.deleted = 0
    )
    WHERE rn = 1
),

member_metrics AS (
    SELECT
        m.gym_id,
        m.branch_id,
        m.id AS member_id,
        lm.status,
        lm.due_date,
        lm.cancellation_date,
        lm.balance,
        lm.receipt_date,              -- ✅ added back
        m.dob
    FROM members_local m
    LEFT JOIN latest_membership lm ON lm.member_id = m.id
    WHERE m.deleted = 0
),

branch_agg AS (
    SELECT
        gym_id,
        branch_id,

        COUNT(member_id) AS total_members,

        SUM(CASE WHEN status='active' AND date(due_date) > date('now')
                 THEN 1 ELSE 0 END) AS active_members,

        SUM(CASE WHEN status='active' AND date(due_date)<=date('now')
                 AND (cancellation_date IS NULL OR date(cancellation_date)>date('now'))
                 THEN 1 ELSE 0 END) AS inactive_members,

        SUM(CASE WHEN cancellation_date IS NOT NULL
                 AND date(cancellation_date)<=date('now')
                 THEN 1 ELSE 0 END) AS cancelled_members,

        SUM(CASE WHEN strftime('%m-%d', dob)=strftime('%m-%d','now')
                 THEN 1 ELSE 0 END) AS birthdays_today,

        SUM(CASE WHEN date(due_date)=date('now') THEN 1 ELSE 0 END) AS due_today,
        SUM(CASE WHEN date(due_date)=date('now','+1 day') THEN 1 ELSE 0 END) AS due_tomorrow,

        SUM(CASE WHEN date(cancellation_date)=date('now') THEN 1 ELSE 0 END) AS cancelled_today,
        SUM(CASE WHEN date(cancellation_date)=date('now','+1 day') THEN 1 ELSE 0 END) AS cancelled_tomorrow,

        -- ✅ balance for current month (same logic as you had earlier)
        SUM(
            CASE
                WHEN receipt_date IS NOT NULL
                     AND strftime('%Y-%m', receipt_date) = strftime('%Y-%m','now')
                THEN balance
                ELSE 0
            END
        ) AS balance_month
    FROM member_metrics
    GROUP BY gym_id, branch_id
),

txn_agg AS (
    SELECT
        gym_id,
        branch_id,

        SUM(CASE WHEN txn_type IN ('admission','renewal','payment')
                     AND status='completed'
                     AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                 THEN amount ELSE 0 END) AS collection_month,

        SUM(CASE WHEN txn_type='refund' THEN amount ELSE 0 END) AS refund_month,

        SUM(CASE WHEN txn_type='admission'
                     AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                 THEN 1 ELSE 0 END) AS admissions_month,

        SUM(CASE WHEN txn_type='renewal'
                     AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                 THEN 1 ELSE 0 END) AS renewals_month,

        SUM(CASE WHEN txn_type='admission' AND date(txn_date)=date('now')
                 THEN 1 ELSE 0 END) AS admissions_today,

        SUM(CASE WHEN txn_type='renewal' AND date(txn_date)=date('now')
                 THEN 1 ELSE 0 END) AS renewals_today,

        SUM(CASE WHEN txn_type IN ('admission','renewal','payment')
                     AND date(txn_date)=date('now')
                 THEN amount ELSE 0 END) AS collection_today
    FROM transactions_local
    WHERE deleted = 0
    GROUP BY gym_id, branch_id
),

expense_agg AS (
    SELECT
        gym_id,
        branch_id,
        SUM(amount) AS expenses_month
    FROM transactions_local
    WHERE txn_type='expense'
      AND deleted = 0
      AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
    GROUP BY gym_id, branch_id
),

-- ░░ Branch rows with all metrics
branch_rows AS (
    SELECT
        g.id AS gym_id,
        bl.id AS branch_id,

        COALESCE(ba.total_members, 0) AS total_members,
        COALESCE(ba.active_members, 0) AS active_members,
        COALESCE(ba.inactive_members, 0) AS inactive_members,
        COALESCE(ba.cancelled_members, 0) AS cancelled_members,
        COALESCE(ba.birthdays_today, 0) AS birthdays_today,

        COALESCE(tx.collection_month, 0) AS collection_month,
        COALESCE(tx.refund_month, 0) AS refund_month,
        COALESCE(tx.admissions_month, 0) AS admissions_month,
        COALESCE(tx.renewals_month, 0) AS renewals_month,
        COALESCE(tx.admissions_today, 0) AS admissions_today,
        COALESCE(tx.renewals_today, 0) AS renewals_today,
        COALESCE(tx.collection_today, 0) AS collection_today,

        COALESCE(exp.expenses_month, 0) AS expenses_month,

        COALESCE(ba.due_today, 0) AS due_today,
        COALESCE(ba.due_tomorrow, 0) AS due_tomorrow,
        COALESCE(ba.cancelled_today, 0) AS cancelled_today,
        COALESCE(ba.cancelled_tomorrow, 0) AS cancelled_tomorrow,

        COALESCE(mb.balance_month, 0) AS balance_month

    FROM gyms_local g
    JOIN branches_local bl ON bl.gym_id = g.id AND bl.deleted = 0
    LEFT JOIN branch_agg ba ON ba.gym_id = g.id AND ba.branch_id = bl.id
    LEFT JOIN txn_agg tx ON tx.gym_id = g.id AND tx.branch_id = bl.id
    LEFT JOIN expense_agg exp ON exp.gym_id = g.id AND exp.branch_id = bl.id
    LEFT JOIN monthly_balance mb 
    ON mb.gym_id = g.id AND mb.branch_id = bl.id

),
monthly_balance AS (
    SELECT
        gym_id,
        branch_id,
        SUM(balance) AS balance_month
    FROM memberships_local
    WHERE deleted = 0
      AND balance > 0
      AND date(receipt_date) >= date('now','start of month')
      AND date(receipt_date) < date('now','start of month','+1 month')
    GROUP BY gym_id, branch_id
),

-- ░░ Whole-gym row = SUM of all branches
gym_rows AS (
    SELECT
        gym_id,
        NULL AS branch_id,

        SUM(total_members) AS total_members,
        SUM(active_members) AS active_members,
        SUM(inactive_members) AS inactive_members,
        SUM(cancelled_members) AS cancelled_members,
        SUM(birthdays_today) AS birthdays_today,

        SUM(collection_month) AS collection_month,
        SUM(refund_month) AS refund_month,
        SUM(admissions_month) AS admissions_month,
        SUM(renewals_month) AS renewals_month,
        SUM(admissions_today) AS admissions_today,
        SUM(renewals_today) AS renewals_today,
        SUM(collection_today) AS collection_today,

        SUM(expenses_month) AS expenses_month,

        SUM(due_today) AS due_today,
        SUM(due_tomorrow) AS due_tomorrow,
        SUM(cancelled_today) AS cancelled_today,
        SUM(cancelled_tomorrow) AS cancelled_tomorrow,

        SUM(balance_month) AS balance_month          -- ✅ whole-gym monthly balance
    FROM branch_rows
    GROUP BY gym_id
)

-- FINAL RESULT
SELECT * FROM gym_rows
UNION ALL
SELECT * FROM branch_rows;

DROP VIEW IF EXISTS member_view_local;

CREATE VIEW member_view_local AS
WITH latest_membership AS (
    SELECT *
    FROM (
        SELECT 
            ms.*,
            ROW_NUMBER() OVER (
                PARTITION BY ms.member_id
                ORDER BY date(ms.receipt_date) DESC
            ) AS rn
        FROM memberships_local ms
        WHERE ms.deleted = 0
    ) 
    WHERE rn = 1
),

/* ---------------------------------------------------------
   NEW: Full membership history grouped into JSON object
----------------------------------------------------------*/
membership_history AS (
    SELECT
        ms.member_id,
        json_group_array(
            json_object(
                'membership_id', ms.id,
                'start_date', ms.start_date,
                'due_date', ms.due_date,
                'cancellation_date', ms.cancellation_date,
                'amount_paid', ms.amount_paid,
                'balance', ms.balance,
                'receipt_date', ms.receipt_date,
                'package_name', p.name,
                'trainer_name', u.name
            )
        ) AS history
    FROM memberships_local ms
    LEFT JOIN packages_local p 
        ON p.id = ms.package_id AND p.deleted = 0
    LEFT JOIN staff_local u 
        ON u.id = ms.trainer_id
    WHERE ms.deleted = 0
    GROUP BY ms.member_id
),

txn_summary AS (
    SELECT
        t.membership_id,
        MAX(t.txn_date) AS txn_date,
        MAX(t.amount) AS amount,
        MAX(t.txn_type) AS txn_type,
        SUM(
            CASE 
                WHEN t.status = 'completed' 
                 AND t.txn_type IN ('admission','renewal','payment')
                THEN t.amount
                ELSE 0
            END
        ) AS total_paid
    FROM transactions_local t
    WHERE t.deleted = 0
    GROUP BY t.membership_id
),

txn_today AS (
    SELECT
        t.membership_id,
        t.txn_date AS txn_date,
        t.amount AS amount,
        t.txn_type AS txn_type
    FROM transactions_local t
    WHERE t.deleted = 0
      AND date(t.txn_date) = date('now')
),

previous_balance AS (
    SELECT
        ms.member_id,
        SUM(ms.balance) AS previous_total_balance
    FROM memberships_local ms
    WHERE ms.deleted = 0
      AND ms.balance > 0
    GROUP BY ms.member_id
)

SELECT
    /* Member info */
    m.id,
    m.gym_id,
    m.branch_id,
    m.member_code,
    m.name,
    m.father_name,
    m.contact,
    m.email,
    m.address,
    m.dob,
    m.admission_date,
    m.gender,
    m.deleted,
    m.photo_url,
    m.serial_number,

    /* Latest membership info */
    ms.id AS membership_id,
    ms.start_date,
    ms.due_date,
    ms.cancellation_date,
    ms.amount_paid,
    ms.discount,
    ms.balance,
    ms.receipt_date,

    tx.txn_date AS last_transaction_date,
    tx.amount AS last_transaction_amount,
    tx.txn_type AS last_transaction_type,

    tt.txn_date AS today_transaction_date,
    date(ms.receipt_date) AS latest_receipt,

    /* Who updated member */
    au.email AS updated_by_email,

    /* Package info */
    p.name AS package_name,

    /* Trainer info */
    u.name AS trainer_name,

    CASE 
        WHEN ms.trainer_expiry IS NOT NULL 
             AND date(ms.trainer_expiry) >= date('now') THEN 'active'
        WHEN ms.trainer_expiry IS NOT NULL 
             AND date(ms.trainer_expiry) < date('now') THEN 'expired'
        ELSE 'not assigned'
    END AS trainer_status,

    /* Membership status */
    CASE
        WHEN ms.status = 'refunded' THEN 'Refunded'
        WHEN ms.cancellation_date IS NOT NULL 
             AND date(ms.cancellation_date) <= date('now') THEN 'Cancelled'
        WHEN ms.due_date IS NOT NULL 
             AND date(ms.due_date) <= date('now') THEN 'Inactive'
        ELSE 'Active'
    END AS current_status,

    /* Meta */
    ms.updated_at AS membership_updated_at,
    ms.synced_at AS membership_synced_at,

    /* Payments aggregated */
    COALESCE(tx.total_paid, 0) AS amount_paid,

    /* Previous all balances */
    COALESCE(pb.previous_total_balance, 0) AS previous_total_balance,

    /* ----------------------------------------------------
       NEW RETURN: FULL MEMBERSHIP HISTORY FOR MEMBER
       ---------------------------------------------------- */
    COALESCE(h.history, '[]') AS membership_history

FROM members_local m
LEFT JOIN latest_membership ms 
       ON ms.member_id = m.id
LEFT JOIN packages_local p 
       ON p.id = ms.package_id AND p.deleted = 0
LEFT JOIN staff_local u 
       ON u.id = ms.trainer_id
LEFT JOIN users_local au 
       ON au.id = m.updated_by
LEFT JOIN txn_summary tx
       ON tx.membership_id = ms.id
LEFT JOIN txn_today tt
       ON tt.membership_id = ms.id
LEFT JOIN previous_balance pb
       ON pb.member_id = m.id
LEFT JOIN membership_history h
       ON h.member_id = m.id

WHERE m.deleted = 0
GROUP BY m.id;
;



DROP VIEW IF EXISTS receipts_view_local;
CREATE VIEW receipts_view_local AS
WITH first_txn AS (
    SELECT membership_id, txn_type AS first_txn_type
    FROM (
        SELECT 
            membership_id,
            txn_type,
            ROW_NUMBER() OVER (PARTITION BY membership_id ORDER BY txn_date ASC) AS rn
        FROM transactions_local
    )
    WHERE rn = 1
),

ordered_ms AS (
    SELECT
        ms.*,
        t.txn_type,
        f.first_txn_type,
        p.id AS pkg_id,
        s.id AS trainer_id,
        m.admission_date AS member_admission_date,
        m.id AS mem_id,
        m.name AS mem_name,
        m.father_name,
        m.contact,
        m.email
    FROM memberships_local ms
    LEFT JOIN transactions_local t ON t.membership_id = ms.id
    LEFT JOIN first_txn f ON f.membership_id = ms.id
    LEFT JOIN packages_local p ON p.id = ms.package_id
    LEFT JOIN staff_local s ON s.id = ms.trainer_id
    LEFT JOIN members_local m ON m.id = ms.member_id
    WHERE ms.deleted = 0 OR ms.deleted IS NULL
    ORDER BY ms.receipt_date DESC   -- ⭐ KEY FOR CORRECT ORDERING
)

SELECT 
    mem_id AS id,
    mem_name AS member_name,
    father_name,
    contact,
    email,

    json_group_object(
        receipt_date,
        json_object(
            'id', id,
            'balance', balance,
            'total_amount', total_amount,
            'amount_paid', amount_paid,
            'discount', discount,
            'admission_fee', admission_fee,
            'package_fee', package_fee,
            'branch_id', branch_id,
            'admission_date', member_admission_date,
            'due_date', due_date,
            'start_date', start_date,
            'type', COALESCE(first_txn_type, txn_type),
            'trainer_id', trainer_id,
            'trainer_assigned_on', trainer_assigned_on,
            'trainer_expiry', trainer_expiry,
            'package_id', pkg_id,
            'receipt_date', receipt_date,
            'cancellation_date', cancellation_date,
            'deleted', deleted,
            'balance', balance,
            'trainer_fee', trainer_fee
        )
    ) AS receipts_json

FROM ordered_ms
GROUP BY 
    mem_id, mem_name, father_name, contact, email;


CREATE TABLE IF NOT EXISTS expenses_local (
    gym_id          TEXT,
    branch_id       TEXT,
    id              TEXT PRIMARY KEY,
    amount          INTEGER,
    txn_date    TEXT,
    category        TEXT,
    description     TEXT,
    payment_method    TEXT,
    updated_at      TEXT,
    name            TEXT,
    synced_at       TEXT,
    updated_by      TEXT,
    deleted         BOOLEAN DEFAULT FALSE,
    is_recurring    BOOLEAN DEFAULT FALSE,
    paid_to         TEXT,
    recurrence_interval INTEGER,
    is_dirty        BOOLEAN DEFAULT FALSE
);
DROP TABLE IF EXISTS attendance_local;
CREATE TABLE attendance_local (
    gym_id TEXT,
    branch_id TEXT DEFAULT '',
    id TEXT PRIMARY KEY,
    serial_number INTEGER ,
    date TEXT,
    check_in_time TEXT,
    check_out_time TEXT,
    updated_at TEXT,
    synced_at TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    UNIQUE (gym_id, branch_id, serial_number, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_lookup
ON attendance_local (gym_id, branch_id, serial_number, date, deleted);

DROP VIEW IF EXISTS attendance_view_local;

CREATE VIEW IF NOT EXISTS attendance_view_local AS
WITH previous_balance AS (
    SELECT
        ms.member_id,
        SUM(ms.balance) AS previous_total_balance
    FROM memberships_local ms
    WHERE ms.deleted = 0
      AND ms.balance > 0
    GROUP BY ms.member_id
)
SELECT
    a.*,
    m.gym_id,
    m.branch_id,
    m.name,
    m.photo_url,
    m.contact,
    m.member_code,
    m.current_status,
    m.serial_number,
    m.membership_id,
    m.due_date,
    m.gender,
    m.trainer_name,
    m.trainer_status,
    m.package_name,
    m.amount_paid,
    m.balance,
    m.discount,
    m.receipt_date,
    m.last_transaction_date,
    m.last_transaction_amount,

    /* NEW FIELD REQUESTED */
    COALESCE(pb.previous_total_balance, 0) AS previous_total_balance

FROM attendance_local a
LEFT JOIN member_view_local m
    ON a.serial_number = m.serial_number
LEFT JOIN previous_balance pb
    ON pb.member_id = m.id;


DROP VIEW IF EXISTS transactions_view_local;

CREATE VIEW transactions_view_local AS
WITH latest_txn AS (
    SELECT *
    FROM (
        SELECT
            t.*,
            ROW_NUMBER() OVER (
                PARTITION BY t.membership_id
                ORDER BY date(t.txn_date) DESC
            ) AS rn
        FROM transactions_local t
        WHERE t.deleted = 0
    )
    WHERE rn = 1
)
SELECT
    lt.membership_id,
    m.*,
    lt.*,
    ms.*,
    p.name AS package_name,
    s.name AS trainer_name,
    CASE 
        WHEN ms.deleted = 1 THEN 'deleted'
        WHEN ms.status = 'refunded' THEN 'refunded'
        WHEN ms.due_date IS NOT NULL 
             AND date(ms.due_date) >= date('now') THEN 'Active'
        WHEN ms.due_date IS NOT NULL 
             AND date(ms.due_date) < date('now') AND (ms.cancellation_date IS NOT NULL AND ms.cancellation_date >= date('now')) THEN 'Inactive'
        WHEN ms.cancellation_date IS NOT NULL 
             AND date(ms.cancellation_date) < date('now') THEN 'Cancelled'
        ELSE 'no active membership'
    END AS membership_status
FROM latest_txn lt
LEFT JOIN members_local m ON m.id = lt.member_id
LEFT JOIN memberships_local ms ON ms.id = lt.membership_id
LEFT JOIN packages_local p ON p.id = ms.package_id
LEFT JOIN staff_local s ON s.id = ms.trainer_id
;

SELECT txn_type,amount FROM transactions_view_local;

CREATE TABLE staff_attendance_local (
    gym_id TEXT,
    branch_id TEXT DEFAULT '',
    staff_id TEXT,
    id TEXT PRIMARY KEY,
    date TEXT,
    check_in_time TEXT,
    check_out_time TEXT,
    updated_at TEXT,
    synced_at TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    UNIQUE (gym_id, branch_id, staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_lookup
ON staff_attendance_local (gym_id, branch_id, staff_id, date, deleted);

-- PAYROLL VIEW FOR STAFF SALARY CALCULATION, IF STAFF IS HOURLY , CALCULATE HOURS WORKED IN THE MONTH.. ALSO GET COMMISSION FROM MEMBERSHIPS IF STAFF_ID EXISTS AND IS A TRAINER
DROP VIEW IF EXISTS payroll_view_local;
CREATE VIEW payroll_view_local AS
WITH attendance_agg AS (
    SELECT
        sa.staff_id,
        sa.gym_id,
        sa.branch_id,
        COUNT(sa.id) AS days_present,
        SUM(
            CASE 
                WHEN sa.check_in_time IS NOT NULL AND sa.check_out_time IS NOT NULL 
                THEN (julianday(sa.check_out_time) - julianday(sa.check_in_time)) * 24
                ELSE 0
            END
        ) AS total_hours_worked
    FROM staff_attendance_local sa
    WHERE sa.deleted = 0
    GROUP BY sa.staff_id, sa.gym_id, sa.branch_id
),commission_agg AS (
    SELECT
        ms.trainer_id AS staff_id,
        ms.gym_id,
        ms.branch_id,
        SUM(
            CASE
                WHEN EXISTS (
                    SELECT 1 
                    FROM transactions_local tx
                    WHERE tx.membership_id = ms.id
                    AND tx.deleted = 0
                    AND tx.status = 'completed'
                    AND tx.txn_type IN ('admission','renewal','payment')
                )
                THEN (ms.trainer_fee * s.commission_percent / 100)
                ELSE 0
            END
        ) AS total_commission

    FROM memberships_local ms
    JOIN staff_local s 
        ON s.id = ms.trainer_id 
    WHERE ms.deleted = 0
    GROUP BY ms.trainer_id, ms.gym_id, ms.branch_id
)

SELECT
    s.id AS staff_id,
    s.name AS staff_name,
    s.gym_id,
    s.branch_id,
    s.role_title,
    s.salary_type,
    s.base_salary,
    s.hourly_rate,
    s.commission_percent,
    COALESCE(aa.days_present, 0) AS days_present,
    COALESCE(aa.total_hours_worked, 0) AS total_hours_worked,
    COALESCE(ca.total_commission, 0) AS total_commission,
    -- CALCULATE SALARY BASED ON SALARY TYPE
    CASE 
        WHEN s.salary_type = 'fixed' THEN s.base_salary
        WHEN s.salary_type = 'hourly' THEN COALESCE(aa.total_hours_worked, 0) * s.hourly_rate
        ELSE 0
    END AS calculated_salary,
    -- TOTAL PAYABLE = SALARY + COMMISSION
    CASE 
        WHEN s.salary_type = 'fixed' THEN s.base_salary + COALESCE(ca.total_commission, 0)
        WHEN s.salary_type = 'hourly' THEN (COALESCE(aa.total_hours_worked, 0) * s.hourly_rate) + COALESCE(ca.total_commission, 0)
        ELSE COALESCE(ca.total_commission, 0)
    END AS total_payable
FROM staff_local s
LEFT JOIN attendance_agg aa ON aa.staff_id = s.id AND aa.gym_id = s.gym_id AND aa.branch_id = s.branch_id
LEFT JOIN commission_agg ca ON ca.staff_id = s.id AND ca.gym_id = s.gym_id AND ca.branch_id = s.branch_id
WHERE s.deleted = 0;

INSERT INTO staff_attendance_local (gym_id,branch_id,staff_id,id,date,check_in_time,check_out_time,updated_at,synced_at,deleted)
VALUES ('f9605b74-94df-4890-9e40-85011fbb368d','ddf26d3d-733a-4ee2-b35e-d08a71c7015f','035b1d9c-3e99-4ec3-900a-f171f2fe8bf8','attend1','2024-06-20','09:00:00','17:00:00','2024-06-20 17:05:00','2024-06-20 17:05:00',0);

DROP VIEW IF EXISTS staff_attendance_view_local;
CREATE VIEW IF NOT EXISTS staff_attendance_view_local AS
SELECT
    s.*,
    sa.*,
    g.name AS gym_name,
    b.name AS branch_name,
    p.calculated_salary,
    p.total_payable,
    P.total_hours_worked
FROM staff_local s
LEFT JOIN gyms_local g ON s.gym_id = g.id
LEFT JOIN branches_local b ON s.branch_id = b.id
LEFT JOIN staff_attendance_local sa ON s.id = sa.staff_id
LEFT JOIN payroll_view_local p ON s.id = p.staff_id
WHERE s.deleted = 0;

DROP VIEW IF EXISTS yearly_txn_summary;

CREATE VIEW yearly_txn_summary AS
WITH base AS (
    SELECT
        strftime('%Y', txn_date) AS year,
        CAST(strftime('%m', txn_date) AS INTEGER) AS month,
        txn_type,
        amount
    FROM transactions_local
    WHERE deleted = 0
      AND txn_type IN ('admission','renewal')
),

-- Monthly aggregates
monthly AS (
    SELECT
        year,
        month,
        SUM(CASE WHEN txn_type='admission' THEN 1 ELSE 0 END) AS admission_count,
        SUM(CASE WHEN txn_type='renewal' THEN 1 ELSE 0 END) AS renewal_count,

        SUM(CASE WHEN txn_type='admission' THEN amount ELSE 0 END) AS admission_value,
        SUM(CASE WHEN txn_type='renewal' THEN amount ELSE 0 END) AS renewal_value
    FROM base
    GROUP BY year, month
),

-- Fill missing months 1-12
calendar AS (
    SELECT y.year AS year, m AS month
    FROM (SELECT DISTINCT year FROM base) y
    CROSS JOIN (
        SELECT 1 AS m UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
        SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION
        SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
    )
),

final AS (
    SELECT
        c.year,
        c.month,

        COALESCE(m.admission_count,0) AS admission_count,
        COALESCE(m.renewal_count,0) AS renewal_count,

        COALESCE(m.admission_value,0) AS admission_value,
        COALESCE(m.renewal_value,0) AS renewal_value,

        -- New totals
        COALESCE(m.admission_count,0) + COALESCE(m.renewal_count,0) AS total_count,
        COALESCE(m.admission_value,0) + COALESCE(m.renewal_value,0) AS total_value

    FROM calendar c
    LEFT JOIN monthly m
      ON m.year = c.year AND m.month = c.month
    ORDER BY c.year, c.month
)

SELECT
    year,

    -- Individual arrays
    '[' || group_concat(admission_count, ',') || ']' AS admission_count_array,
    '[' || group_concat(renewal_count, ',') || ']' AS renewal_count_array,
    '[' || group_concat(admission_value, ',') || ']' AS admission_value_array,
    '[' || group_concat(renewal_value, ',') || ']' AS renewal_value_array,

    -- NEW: total monthly counts
    '[' || group_concat(total_count, ',') || ']' AS total_count_array,

    -- NEW: total monthly values
    '[' || group_concat(total_value, ',') || ']' AS total_value_array

FROM final
GROUP BY year;

