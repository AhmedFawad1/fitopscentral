
export const mig = {
    version: 10,
    migrate: [
`DROP VIEW receipt_view_local;`,
`CREATE VIEW receipts_view_local AS
SELECT
  m.id                AS membership_id,
  m.gym_id,
  m.branch_id,
  m.member_id,
  m.status,
  m.package_id,
  m.trainer_id,
  m.start_date,
  m.due_date,
  m.cancellation_date,
  m.trainer_start,
  m.trainer_expiry,
  m.receipt_date,
  m.total_amount,
  m.discount,
  m.amount_paid,
  m.balance,
  m.admission_fee,
  m.package_fee,
  m.created_at,
  m.updated_at,

  /* -------------------------------
     Transaction history as JSON
  --------------------------------*/
  COALESCE(
  json_group_array(
    CASE
      WHEN t.id IS NOT NULL THEN
        json_object(
          'transaction_id', t.id,
          'txn_type', t.txn_type,
          'amount', t.amount,
          'payment_method', t.payment_method,
          'status', t.status,
          'txn_date', t.txn_date
        )
    END
  ),
  '[]'
) AS transaction_history


  /* -------------------------------
     Total paid via transactions
  --------------------------------*/
  COALESCE(
    SUM(
      CASE
        WHEN t.deleted = 0 THEN t.amount
        ELSE 0
      END
    ),
    0
  ) AS total_paid_via_transactions

FROM memberships_local m
LEFT JOIN transactions_local t
  ON t.membership_id = m.id
 AND t.deleted = 0

WHERE m.deleted = 0
GROUP BY m.id
ORDER BY m.receipt_date desc;`,
`DROP VIEW IF EXISTS member_view_local;`,
// Updated member_view_local with accurate balance calculation
`CREATE VIEW member_view_local AS
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
   SUM transactions per membership (refund-aware)
----------------------------------------------------------*/
txn_paid AS (
    SELECT
        t.membership_id,
        SUM(
            CASE
                WHEN t.deleted = 0 AND t.txn_type IN ('admission','renewal','payment')
                    THEN t.amount
                WHEN t.deleted = 0 AND t.txn_type = 'refund'
                    THEN -ABS(t.amount)
                ELSE 0
            END
        ) AS amount_paid
    FROM transactions_local t
    GROUP BY t.membership_id
),
/* ---------------------------------------------------------
   FIRST TRANSACTION (DATE + TYPE)
----------------------------------------------------------*/
first_txn AS (
    SELECT
        membership_id,
        txn_type AS first_transaction_type,
        txn_date AS first_transaction_date
    FROM (
        SELECT
            membership_id,
            txn_type,
            txn_date,
            ROW_NUMBER() OVER (
                PARTITION BY membership_id
                ORDER BY DATE(txn_date) ASC, id ASC
            ) AS rn
        FROM transactions_local
        WHERE deleted = 0
    )
    WHERE rn = 1
),

/* ---------------------------------------------------------
   Determine latest transaction (date + type)
----------------------------------------------------------*/
txn_ranked AS (
    SELECT
        t.*,
        ROW_NUMBER() OVER (
            PARTITION BY t.membership_id
            ORDER BY DATE(t.txn_date) DESC, t.id DESC
        ) AS txn_rank_desc
    FROM transactions_local t
    WHERE t.deleted = 0
),

latest_txn AS (
    SELECT *
    FROM txn_ranked
    WHERE txn_rank_desc = 1
),

/* ---------------------------------------------------------
   Membership history JSON
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
                'amount_paid', COALESCE(tp.amount_paid, 0),
                'balance', (ms.total_amount - IFNULL(ms.discount,0)) - COALESCE(tp.amount_paid, 0),
                'receipt_date', ms.receipt_date,
                'package_name', p.name,
                'trainer_name', u.name
            )
        ) AS history
    FROM memberships_local ms
    LEFT JOIN txn_paid tp ON tp.membership_id = ms.id
    LEFT JOIN packages_local p ON p.id = ms.package_id AND p.deleted = 0
    LEFT JOIN staff_local u ON u.id = ms.trainer_id
    WHERE ms.deleted = 0
    GROUP BY ms.member_id
),
total_active_memberships AS (
    SELECT
        SUM(ms.total_amount - IFNULL(ms.discount, 0)) AS total_amount_after_discount
    FROM memberships_local ms
    WHERE
        ms.deleted = 0
        AND ms.status = 'active'
),
total_transactions_paid AS (
    SELECT
        SUM(
                CASE
                WHEN t.deleted = false THEN
                 CASE
                         WHEN t.txn_type = 'refund' THEN -ABS(t.amount)
                ELSE t.amount
                END
                ELSE 0
                END
        ) AS total_paid

    FROM transactions_local t
    JOIN memberships_local ms ON ms.id = t.membership_id
    WHERE
        t.deleted = 0
        AND ms.deleted = 0
        AND ms.status = 'active'
),
member_total_balance AS (
    SELECT
        ms.member_id,
        SUM(
            CASE
                WHEN ms.status = 'cancelled' THEN 0
                ELSE (ms.total_amount - IFNULL(ms.discount, 0))
                     - COALESCE(tp.amount_paid, 0)
            END
        ) AS member_balance
    FROM memberships_local ms
    LEFT JOIN txn_paid tp ON tp.membership_id = ms.id
    WHERE ms.deleted = 0
    GROUP BY ms.member_id
)
SELECT
    /* Member Info */
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
    m.blocked,

    /* Latest Membership */
    ms.id AS membership_id,
    ms.start_date,
    ms.due_date,
    ms.cancellation_date,
    ms.discount,
    ms.receipt_date,

    /* Accurate amount paid */
    COALESCE(tp.amount_paid, 0) AS amount_paid,

    /* TRUE BALANCE */
     CASE
        WHEN ms.status = 'cancelled' THEN 0
        ELSE (ms.total_amount - IFNULL(ms.discount, 0)) - COALESCE(tp.amount_paid, 0)
     END AS balance,

    /* Latest Transaction Info */
    lt.txn_date AS last_transaction_date,
    lt.amount AS last_transaction_amount,
    lt.txn_type AS last_transaction_type,

    /* ⭐ FIRST TRANSACTION INFO */
    ft.first_transaction_type,
    ft.first_transaction_date,

    date(ms.receipt_date) AS latest_receipt,

    /* Package & Trainer */
    p.name AS package_name,
    u.name AS trainer_name,

    /* Trainer Status */
    CASE
        WHEN ms.trainer_expiry IS NOT NULL AND date(ms.trainer_expiry) >= date('now')
            THEN 'active'
        WHEN ms.trainer_expiry IS NOT NULL AND date(ms.trainer_expiry) < date('now')
            THEN 'expired'
        ELSE 'not assigned'
    END AS trainer_status,
    ms.trainer_expiry,

    /* Membership Status */
    CASE
        WHEN (ms.status = 'cancelled' || ms.due_date is null) THEN 'Cancelled'
        WHEN (ms.status = 'refunded') THEN 'Refunded'
        WHEN ms.cancellation_date IS NOT NULL AND date(ms.cancellation_date) <= date('now')
            THEN 'Cancelled'
        WHEN ms.due_date <= date('now') THEN 'Inactive'
        ELSE 'Active'
    END AS current_status,

    ms.updated_at AS membership_updated_at,
    ms.synced_at AS membership_synced_at,

    /* Entire Membership History JSON */
    COALESCE(h.history, '[]') AS membership_history,
    COALESCE(mtb.member_balance, 0) AS overall_balance


FROM members_local m
LEFT JOIN latest_membership ms ON ms.member_id = m.id
LEFT JOIN packages_local p ON p.id = ms.package_id AND p.deleted = 0
LEFT JOIN staff_local u ON u.id = ms.trainer_id
LEFT JOIN txn_paid tp ON tp.membership_id = ms.id
LEFT JOIN latest_txn lt ON lt.membership_id = ms.id
LEFT JOIN first_txn ft ON ft.membership_id = ms.id
LEFT JOIN membership_history h ON h.member_id = m.id
LEFT JOIN member_total_balance mtb
    ON mtb.member_id = m.id

/*    add these */

WHERE m.deleted = 0
GROUP BY m.id;`,
`DROP VIEW IF EXISTS receipts_view_local;`,
`CREATE VIEW receipts_view_local AS
SELECT
  m.id                AS membership_id,
  m.gym_id,
  m.branch_id,
  m.member_id,
  m.status,
  m.package_id,
  m.trainer_id,
  m.start_date,
  m.due_date,
  m.cancellation_date,
  m.trainer_start,
  m.trainer_expiry,
  m.receipt_date,
  m.total_amount,
  m.discount,
  m.amount_paid,
  m.balance,
  m.admission_fee,
  m.package_fee,
  m.created_at,
  m.updated_at,

  /* -------------------------------
     Transaction history as JSON
  --------------------------------*/
  COALESCE(
    json_group_array(
      json_object(
        'transaction_id', t.id,
        'txn_type', t.txn_type,
        'amount', t.amount,
        'payment_method', t.payment_method,
        'status', t.status,
        'txn_date', t.txn_date
      )
    ),
    '[]'
  ) AS transaction_history,

  /* -------------------------------
     Total paid via transactions
  --------------------------------*/
  COALESCE(
    SUM(
      CASE
        WHEN t.deleted = 0 THEN t.amount
        ELSE 0
      END
    ),
    0
  ) AS total_paid_via_transactions

FROM memberships_local m
LEFT JOIN transactions_local t
  ON t.membership_id = m.id
 AND t.deleted = 0

WHERE m.deleted = 0
GROUP BY m.id
ORDER BY m.receipt_date desc;`,

`DROP VIEW IF EXISTS attendance_view_local;`,

`CREATE VIEW attendance_view_local AS
WITH txn_paid AS (
    SELECT
        ms.member_id,
        SUM(
            CASE
                WHEN t.deleted = 0
                 AND t.txn_type IN ('admission','renewal','payment')
                THEN t.amount
                ELSE 0
            END
        ) AS amount_paid_total
    FROM memberships_local ms
    LEFT JOIN transactions_local t
        ON t.membership_id = ms.id
    WHERE ms.deleted = 0
    GROUP BY ms.member_id
),

member_total_amount AS (
    SELECT
        ms.member_id,
        SUM(ms.total_amount - IFNULL(ms.discount, 0)) AS total_payable_all_memberships
    FROM memberships_local ms
    WHERE ms.deleted = 0
    GROUP BY ms.member_id
),

accurate_balance AS (
    SELECT
        ta.member_id,
        mta.total_payable_all_memberships,
        ta.amount_paid_total,

        /* TRUE BALANCE */
        (mta.total_payable_all_memberships - ta.amount_paid_total) AS final_balance
    FROM txn_paid ta
    LEFT JOIN member_total_amount mta
        ON mta.member_id = ta.member_id
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
    m.trainer_expiry,
    /* From transactions recalculated properly */
    COALESCE(tp.amount_paid_total, 0) AS amount_paid,

    /* ✔ Accurate cumulative balance across ALL memberships */
    COALESCE(ab.final_balance, 0) AS balance,

    m.discount,
    m.receipt_date,
    m.last_transaction_date,
    m.last_transaction_amount

FROM attendance_local a
LEFT JOIN member_view_local m
    ON a.serial_number = m.serial_number

LEFT JOIN txn_paid tp
    ON tp.member_id = m.id

LEFT JOIN accurate_balance ab
    ON ab.member_id = m.id;

DROP VIEW IF EXISTS txn_view_local;

CREATE VIEW txn_view_local AS
WITH txn_total AS(
        SELECT
        membership_id,
        SUM(
            CASE
                WHEN deleted = 0
                AND txn_type IN ('admission','renewal','payment')
                THEN amount

                WHEN deleted = 0
                AND txn_type = 'refund'
                THEN -ABS(amount)

                ELSE 0
             END

        ) AS total_paid
    FROM transactions_local
    GROUP BY membership_id
)
SELECT
        m.serial_number,
        m.id,
        m.gym_id,
        m.branch_id,
        m.name,
        m.admission_date,
        ms.due_date,
        ms.cancellation_date,
        ms.start_date,
        (ms.total_amount - IFNULL(ms.discount, 0)) AS total_payable_after_discount,
        tnt.total_paid,
        (ms.total_amount - IFNULL(tnt.total_paid, 0)) AS balance,
        ms.id as membership_id,
        t.id as transaction_id,
        t.amount,
        t.txn_date,
        t.txn_type,
        t.payment_method,
        p.id as package_id,
        s.id as trainer_id,
        p.name as package_name,
        s.name as trainer_name
from members_local m
left join transactions_local t on t.member_id = m.id
left join memberships_local ms on ms.id = t.membership_id and ms.member_id = m.id
left join txn_total tnt on tnt.membership_id = ms.id
left join packages_local p on p.id = ms.package_id
left join staff_local s on s.id = ms.trainer_id;`,
'DROP VIEW IF EXISTS gym_dashboard_view;',
`CREATE VIEW gym_dashboard_view AS
WITH
/* ---------------------------------------------------------
   1. Latest membership per member (same as before)
----------------------------------------------------------*/
latest_membership AS (
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
   2. TRUE ACCURATE BALANCE (membership-level)
----------------------------------------------------------*/
accurate_balance_per_membership AS (
    SELECT
        ms.id AS membership_id,
        ms.member_id,
        ms.gym_id,
        ms.branch_id,

        (ms.total_amount - IFNULL(ms.discount, 0)) AS total_payable,

        ms.amount_paid AS amount_paid,

        (ms.total_amount - IFNULL(ms.discount, 0)) - ms.amount_paid
            AS accurate_balance,

        ms.receipt_date
    FROM memberships_local ms
    WHERE ms.deleted = 0
),

/* ---------------------------------------------------------
   3. Member metrics based on latest membership
----------------------------------------------------------*/
member_metrics AS (
    SELECT
        m.gym_id,
        m.branch_id,
        m.id AS member_id,
        lm.status,
        lm.due_date,
        lm.cancellation_date,
        m.dob,
        lm.receipt_date
    FROM members_local m
    LEFT JOIN latest_membership lm ON lm.member_id = m.id
    WHERE m.deleted = 0
),

/* ---------------------------------------------------------
   4. Branch-level aggregation
----------------------------------------------------------*/
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

        SUM(CASE WHEN cancellation_date IS NOT NULL
                 AND date(cancellation_date)=date('now')
                 THEN 1 ELSE 0 END) AS cancelled_today,

        SUM(CASE WHEN cancellation_date IS NOT NULL
                 AND date(cancellation_date)=date('now','+1 day')
                 THEN 1 ELSE 0 END) AS cancelled_tomorrow
    FROM member_metrics
    GROUP BY gym_id, branch_id
),

/* ---------------------------------------------------------
   5. Accurate monthly balance per branch
----------------------------------------------------------*/
monthly_balance AS (
    SELECT
        gym_id,
        branch_id,
        SUM(accurate_balance) AS balance_month
    FROM accurate_balance_per_membership
    WHERE accurate_balance > 0
      AND receipt_date IS NOT NULL
      AND strftime('%Y-%m', receipt_date)=strftime('%Y-%m', 'now')
    GROUP BY gym_id, branch_id
),

/* ---------------------------------------------------------
   6. Transaction metrics (same as before)
----------------------------------------------------------*/
txn_agg AS (
    SELECT
        gym_id,
        branch_id,

        SUM(CASE WHEN txn_type IN ('admission','renewal','payment')
                     AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                 THEN amount ELSE 0 END) AS collection_month,

        SUM(CASE WHEN txn_type='refund'
                 AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
                THEN amount ELSE 0 END) AS refund_month,

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

/* ---------------------------------------------------------
   7. Monthly expenses
----------------------------------------------------------*/
expense_agg AS (
    SELECT
        gym_id,
        branch_id,
        SUM(amount) AS expenses_month
    FROM expenses_local
    WHERE deleted = 0
      AND strftime('%Y-%m', txn_date)=strftime('%Y-%m','now')
    GROUP BY gym_id, branch_id
),

/* ---------------------------------------------------------
   8. Final branch-wise rows
----------------------------------------------------------*/
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
    JOIN branches_local bl
        ON bl.gym_id = g.id AND bl.deleted = 0
    LEFT JOIN branch_agg ba
        ON ba.gym_id = g.id AND ba.branch_id = bl.id
    LEFT JOIN txn_agg tx
        ON tx.gym_id = g.id AND tx.branch_id = bl.id
    LEFT JOIN expense_agg exp
        ON exp.gym_id = g.id AND exp.branch_id = bl.id
    LEFT JOIN monthly_balance mb
        ON mb.gym_id = g.id AND mb.branch_id = bl.id
),

/* ---------------------------------------------------------
   9. Gym-level totals
----------------------------------------------------------*/
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

        SUM(balance_month) AS balance_month
    FROM branch_rows
    GROUP BY gym_id
)

/* ---------------------------------------------------------
   10. Final Output
----------------------------------------------------------*/
SELECT * FROM gym_rows
UNION ALL
SELECT * FROM branch_rows;`
]
}