const pool = require('../database/pool');

// Function to create order
const createOrder = async (orderData) => {
    const [result] = await pool.query(`INSERT INTO orders SET ?`, orderData);
    return result.insertId;
};

// Function to add order items
const addOrderItem = async (itemData) => {
    const [result] = await pool.query(`INSERT INTO order_items SET ?`, itemData);
    return result.insertId;
};

// Function to get order items
const getOrderItems = async (orderId) => {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    return items;
};

// Function to get order by user and status
const getOrdersByUserAndStatus = async (userId, status) => {
    const [rows] = await pool.query(`SELECT * FROM orders WHERE customer_id = ? AND status = ?`, [
        userId,
        status,
    ]);
    return rows;
};

// Function to create order status history
const createOrderStatus = async ({ orderId, newStatus, notes }) => {
    await pool.query(`UPDATE orders SET status = ? WHERE order_id = ?`, [newStatus, orderId]);

    await pool.query(
        `INSERT INTO order_status_history 
         (order_id, status, notes) 
         VALUES (?, ?, ?)`,
        [orderId, newStatus, notes]
    );
};

// Function to get order status history
const getOrderStatusHistory = async (orderId) => {
    const [history] = await pool.query('SELECT * FROM order_status_history WHERE order_id = ?', [
        orderId,
    ]);
    return history;
};

// const getOrderById = async (orderId) => {
//     const [order] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
//     return order[0];
// };

// const updateOrderTotal = async (orderId) => {
//     await pool.query(
//         `UPDATE orders
//          SET total_amount = (
//              SELECT SUM(subtotal)
//              FROM order_items
//              WHERE order_id = ?
//          )
//          WHERE order_id = ?`,
//         [orderId, orderId]
//     );
// };

module.exports = {
    createOrder,
    addOrderItem,
    createOrderStatus,
    getOrderItems,
    getOrderStatusHistory,
    getOrdersByUserAndStatus,
};
