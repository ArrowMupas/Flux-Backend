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
                r.contact_number
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

const createReturnRequest = async (orderId, customerId, reason, contactNumber) => {
    const [result] = await pool.query(
        SQL`
            INSERT INTO returns (order_id, customer_id, reason, contact_number)
            VALUES (${orderId}, ${customerId}, ${reason}, ${contactNumber})
        `
    );

    const [rows] = await pool.query(SQL`SELECT * FROM returns WHERE id = ${result.insertId}`);

    return rows[0];
};

module.exports = { getAllReturnRequests, checkExistingReturn, getLatestDeliveredDate, createReturnRequest };
