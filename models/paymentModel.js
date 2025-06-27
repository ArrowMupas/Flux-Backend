const pool = require('../database/pool');

// Function to create a payment
const createPayment = async (
    order_id,
    method,
    reference_number,
    account_name,
    address,
    connection = pool
) => {
    const [result] = await connection.query(
        `INSERT INTO payments (order_id, method, reference_number, account_name, address) VALUES (?, ?, ?, ?, ?)`,
        [order_id, method, reference_number, account_name, address]
    );
    return result.insertId;
};

// Function to get payment details by order ID
const getPaymentByOrderId = async (orderId, connection = pool) => {
    const [rows] = await connection.query(
        `SELECT 
            p.id AS payment_id,
            o.id,
            o.status AS order_status,
            o.total_amount,
            p.method,
            p.reference_number,
            p.account_name,
            p.address,
            p.created_at,
            p.updated_at
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE p.order_id = ?`,
        [orderId]
    );
    return rows[0];
};

module.exports = {
    createPayment,
    getPaymentByOrderId,
};
