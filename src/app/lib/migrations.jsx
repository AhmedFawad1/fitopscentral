
export const mig = {
    version: 14,
    migrate: [
`drop view  txn_view_local;`,
`
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
        MAX(
    ((ms.total_amount - IFNULL(ms.discount, 0)) - IFNULL(tnt.total_paid, 0)),
    0
) AS balance,
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
left join staff_local s on s.id = ms.trainer_id;
`,
`DROP VIEW member_view_local;`,
`
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
                ELSE MAX((ms.total_amount - IFNULL(ms.discount, 0))
                     - COALESCE(tp.amount_paid, 0),0)
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
`DROP VIEW attendance_view_local;`,
`
CREATE VIEW attendance_view_local AS
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
    MAX(COALESCE(ab.final_balance, 0),0) AS balance,

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
    ON ab.member_id = m.id;`
    ]
}