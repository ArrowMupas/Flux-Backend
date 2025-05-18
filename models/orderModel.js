const pool = require('../database/pool');

// Function to create order
const createOrder = async (orderData, connection = pool) => {
    const [result] = await connection.query(`INSERT INTO orders SET ?`, orderData);
    return result.insertId;
};

// Function to add order items
const addOrderItem = async (itemData, connection = pool) => {
    const [result] = await connection.query(`INSERT INTO order_items SET ?`, itemData);
    return result.insertId;
};

// Function to get order items
const getOrderItems = async (orderId) => {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    return items;
};

// Function to get order by id
const getOrderById = async (orderId) => {
    const [rows] = await pool.query(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
    return rows[0];
};

// Function to get order by user and status
const getOrdersByUserAndStatus = async (userId, status) => {
    const [rows] = await pool.query(`SELECT * FROM orders WHERE customer_id = ? AND status = ?`, [
        userId,
        status,
    ]);
    return rows;
};

// Function to get all orders by user
const getAllOrdersByUser = async (userId) => {
    const [rows] = await pool.query(`SELECT * FROM orders WHERE customer_id = ?`, [userId]);
    return rows;
};

// Function to create initial order status
const createOrderStatus = async ({ orderId, newStatus, notes }, connection = pool) => {
    await connection.query(`UPDATE orders SET status = ? WHERE order_id = ?`, [newStatus, orderId]);

    // Log it on status history
    await connection.query(
        `INSERT INTO order_status_history 
         (order_id, status, notes) 
         VALUES (?, ?, ?)`,
        [orderId, newStatus, notes]
    );
};

// Function to get order status history
const getOrderStatusHistory = async (orderId) => {
    const [history] = await pool.query(
        'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY status_date ASC',
        [orderId]
    );
    return history;
};

// Function to cancel order
const cancelOrder = async (orderId, notes, connection = pool) => {
    await connection.query(`UPDATE orders SET status = 'cancelled' WHERE order_id = ?`, [orderId]);

    // Log the cancel on status history
    await connection.query(
        `INSERT INTO order_status_history (order_id, status, notes) VALUES (?, 'cancelled', ?)`,
        [orderId, notes]
    );
};

module.exports = {
    createOrder,
    addOrderItem,
    createOrderStatus,
    getOrderById,
    getOrderItems,
    getOrderStatusHistory,
    getOrdersByUserAndStatus,
    getAllOrdersByUser,
    cancelOrder,
};
