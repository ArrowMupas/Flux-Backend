const pool = require('../database/pool');
const SQL = require('sql-template-strings');

const getAllRefundRequests = async () => {
    const [rows] = await pool.query(
        SQL`
            SELECT 
                r.id,
                r.order_id,
                r.customer_id,
                u.username AS customer_name,
                r.reason,
                r.status,
                r.processed_by,
                r.admin_notes,
                r.created_at,
                r.resolved_at,
                r.contact_number
            FROM refunds r
            JOIN users u ON r.customer_id = u.id
            ORDER BY r.created_at DESC
        `
    );

    return rows;
};

const checkExistingRefund = async (orderId) => {
    const [rows] = await pool.query(SQL`SELECT id FROM refunds WHERE order_id = ${orderId} LIMIT 1`);
    return rows[0] || null;
};

const getLatestCancelledDate = async (orderId) => {
    const [rows] = await pool.query(
        SQL`
            SELECT status_date
            FROM order_status_history
            WHERE order_id = ${orderId}
              AND status = 'cancelled'
            ORDER BY status_date DESC
            LIMIT 1
        `
    );
    return rows[0] || null;
};

const createRefundRequest = async (orderId, customerId, reason, contactNumber) => {
    const [result] = await pool.query(
        SQL`
            INSERT INTO refunds (order_id, customer_id, reason, contact_number)
            VALUES (${orderId}, ${customerId}, ${reason}, ${contactNumber})
        `
    );

    const [rows] = await pool.query(SQL`SELECT * FROM refunds WHERE id = ${result.insertId}`);

    return rows[0];
};

const getOrderStatusAndRefund = async (orderId) => {
    const query = SQL`
        SELECT 
            o.status,
            CASE 
                WHEN r.id IS NOT NULL THEN TRUE 
                ELSE FALSE 
            END AS has_pending_refund
        FROM orders o
        LEFT JOIN refunds r 
            ON o.id = r.order_id 
            AND r.status = 'pending'
        WHERE o.id = ${orderId};
    `;

    const [rows] = await pool.query(query);
    return rows[0];
};

const approveRefundRequest = async (orderId, adminNotes, adminId, connection = pool) => {
    const query = SQL`
        UPDATE refunds
        SET status = 'approved',
            processed_by = ${adminId},
            admin_notes = ${adminNotes},
            resolved_at = NOW()
        WHERE order_id = ${orderId}
            AND status = 'pending';
    `;

    return await connection.query(query);
};

const denyRefundRequest = async (orderId, adminNotes, adminId, connection = pool) => {
    const query = SQL`
        UPDATE refunds
        SET status = 'denied',
            processed_by = ${adminId},
            admin_notes = ${adminNotes},
            resolved_at = NOW()
        WHERE order_id = ${orderId}
            AND status = 'pending';
    `;

    return await connection.query(query);
};

module.exports = {
    getAllRefundRequests,
    checkExistingRefund,
    getLatestCancelledDate,
    createRefundRequest,
    approveRefundRequest,
    getOrderStatusAndRefund,
    denyRefundRequest,
};
