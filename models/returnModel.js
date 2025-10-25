const pool = require('../database/pool');
const SQL = require('sql-template-strings');

const getAllReturnRequests = async () => {
    const [rows] = await pool.query(
        SQL`
      SELECT 
        r.id,
        r.order_id,
        r.customer_id,
        u.username AS customer_name,
        r.reason,
        r.status,
        r.admin_notes,
        r.created_at,
        r.resolved_at,
        r.contact_number,
        r.image_url
      FROM returns r
      JOIN users u ON r.customer_id = u.id
      ORDER BY r.created_at DESC
    `
    );

    return rows;
};

const checkExistingReturn = async (orderId) => {
    const [rows] = await pool.query(SQL`SELECT id FROM returns WHERE order_id = ${orderId} LIMIT 1`);
    return rows[0] || null;
};

const getLatestDeliveredDate = async (orderId) => {
    const [rows] = await pool.query(
        SQL`
            SELECT status_date
            FROM order_status_history
            WHERE order_id = ${orderId}
              AND status = 'delivered'
            ORDER BY status_date DESC
            LIMIT 1
        `
    );
    return rows[0] || null;
};

const createReturnRequest = async (orderId, customerId, reason, contactNumber, imageURL = null) => {
    const [result] = await pool.query(
        SQL`
      INSERT INTO returns (order_id, customer_id, reason, contact_number, image_url)
      VALUES (${orderId}, ${customerId}, ${reason}, ${contactNumber}, ${imageURL})
    `
    );

    const [rows] = await pool.query(SQL`SELECT * FROM returns WHERE id = ${result.insertId}`);

    return rows[0];
};

const getOrderStatusAndReturn = async (orderId) => {
    const query = SQL`
        SELECT 
            o.status,
            CASE 
                WHEN r.id IS NOT NULL THEN TRUE 
                ELSE FALSE 
            END AS has_pending_return
        FROM orders o
        LEFT JOIN returns r 
            ON o.id = r.order_id 
            AND r.status = 'pending'
        WHERE o.id = ${orderId};
    `;

    const [rows] = await pool.query(query);
    return rows[0];
};

const approveReturnRequest = async (orderId, adminNotes, connection = pool) => {
    const query = SQL`
        UPDATE returns
        SET status = 'approved',
            admin_notes = ${adminNotes},
            resolved_at = NOW()
        WHERE order_id = ${orderId}
            AND status = 'pending';
    `;

    return await connection.query(query);
};

const denyReturnRequest = async (orderId, adminNotes, connection = pool) => {
    const query = SQL`
        UPDATE returns
        SET status = 'denied',
            admin_notes = ${adminNotes},
            resolved_at = NOW()
        WHERE order_id = ${orderId}
            AND status = 'pending';
    `;

    return await connection.query(query);
};

module.exports = {
    getAllReturnRequests,
    checkExistingReturn,
    getLatestDeliveredDate,
    createReturnRequest,
    approveReturnRequest,
    getOrderStatusAndReturn,
    denyReturnRequest,
};
