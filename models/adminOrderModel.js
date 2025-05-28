const pool = require('../database/pool');

// Function to get all order
const getAllOrders = async () => {
    const [rows] = await pool.query(`
        SELECT o.*, p.method AS payment_method
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        ORDER BY o.order_date DESC
    `);
    return rows;
};

// Function to get order
const getOrderById = async (orderId) => {
    const [rows] = await pool.query(
        `
        SELECT o.*, p.method AS payment_method
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE o.id = ?
    `,
        [orderId]
    );
    return rows[0];
};

// Function to get order by status
const getOrdersByStatus = async (status) => {
    const [rows] = await pool.query(
        `
        SELECT o.*, p.method AS payment_method
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE o.status = ?
        ORDER BY o.order_date DESC
    `,
        [status]
    );
    return rows;
};

// Function to get order items
const getOrderItems = async (orderId) => {
    const [items] = await pool.query(
        `
        SELECT oi.*, pr.name AS product_name
        FROM order_items oi
        LEFT JOIN products pr ON oi.product_id = pr.id
        WHERE oi.order_id = ?
    `,
        [orderId]
    );
    return items;
};

// Function to get all orders of customer
const getAllOrdersByUser = async (userId) => {
    const [rows] = await pool.query(
        `
        SELECT o.*, p.method AS payment_method
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE o.customer_id = ?
        ORDER BY o.order_date DESC
    `,
        [userId]
    );
    return rows;
};

// Function to get order status history
const getOrderStatusHistory = async (orderId) => {
    const [rows] = await pool.query(
        'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY status_date ASC',
        [orderId]
    );
    return rows;
};

// Function to change status of an order
const changeOrderStatus = async (orderId, newStatus, notes, connection = pool) => {
    await connection.query(`UPDATE orders SET status = ? WHERE id = ?`, [newStatus, orderId]);

    // Log the change on status history
    await connection.query(
        `INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)`,
        [orderId, newStatus, notes]
    );
};

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByStatus,
    getOrderItems,
    getAllOrdersByUser,
    getOrderStatusHistory,
    changeOrderStatus,
};
