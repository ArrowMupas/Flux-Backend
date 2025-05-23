const pool = require('../database/pool');

const createPayment = async (order_id, method, reference_number, account_name, address) => {
    const [result] = await pool.query(
        `INSERT INTO payments (order_id, method, reference_number, account_name, address) VALUES (?, ?, ?, ?, ?)`,
        [order_id, method, reference_number, account_name, address]
    );
    return result.insertId;
};

const getPaymentByOrderId = async (orderId) => {
    const [rows] = await pool.query(
        `SELECT 
            p.id AS payment_id,
            o.order_id,
            o.status AS order_status,
            o.total_amount,
            p.method,
            p.reference_number,
            p.account_name,
            p.address,
            p.created_at,
            p.updated_at
        FROM payments p
        JOIN orders o ON p.order_id = o.order_id
        WHERE p.order_id = ?`,
        [orderId]
    );
    return rows[0];
};

module.exports = {
    createPayment,
    getPaymentByOrderId,
};
