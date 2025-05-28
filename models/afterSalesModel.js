const pool = require('../database/pool');

// Create a refund or return request
const createRequest = async (type, orderId, userId, reason) => {
    const [result] = await pool.query(
        `INSERT INTO after_sales_requests (type, order_id, user_id, reason)
         VALUES (?, ?, ?, ?)`,
        [type, orderId, userId, reason]
    );
    const [request] = await pool.query(`SELECT * FROM after_sales_requests WHERE id = ?`, [
        result.insertId,
    ]);
    return request[0];
};

// Update status (requested -> pending/done)
const updateRequestStatus = async (id, status, connection = pool) => {
    await connection.query(
        `UPDATE after_sales_requests
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, id]
    );
    const [request] = await connection.query(`SELECT * FROM after_sales_requests WHERE id = ?`, [
        id,
    ]);
    return request[0];
};

// Get all requests (for admin)
const getAllRequests = async () => {
    const [requests] = await pool.query(
        `SELECT 
            r.*, 
            u.username, 
            o.order_date 
         FROM after_sales_requests r
         JOIN users u ON r.user_id = u.id
         JOIN orders o ON r.order_id = o.id
         ORDER BY r.created_at DESC`
    );
    return requests;
};

// Get user-specific requests
const getUserRequests = async (userId) => {
    const [requests] = await pool.query(
        `SELECT 
            r.*, 
            o.order_date 
         FROM after_sales_requests r
         JOIN orders o ON r.order_id = o.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
    );
    return requests;
};

const getRefundById = async (refundId, connection = pool) => {
    const [rows] = await connection.query(`SELECT * FROM after_sales_requests WHERE id = ?`, [
        refundId,
    ]);
    return rows[0];
};

// Optional: get refund requests by status (for listing)
const getRefundsByStatus = async (status, connection = pool) => {
    const [rows] = await connection.query(
        `SELECT * FROM after_sales_requests WHERE status = ? ORDER BY created_at DESC`,
        [status]
    );
    return rows;
};

module.exports = {
    createRequest,
    updateRequestStatus,
    getAllRequests,
    getUserRequests,
    getRefundById,
};
