const pool = require('../database/pool');

const createOrder = async (orderData) => {
    const [result] = await pool.query(
        `INSERT INTO orders SET ?`, 
        orderData
    );
    return result.insertId;
};

const addOrderItem = async (itemData) => {
    const [result] = await pool.query(
        `INSERT INTO order_items SET ?`,
        itemData
    );
    return result.insertId;
};

const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    await pool.query(
        `UPDATE orders SET status = ? WHERE order_id = ?`,
        [newStatus, orderId]
    );
    
    await pool.query(
        `INSERT INTO order_status_history 
         (order_id, status, notes) 
         VALUES (?, ?, ?)`,
        [orderId, newStatus, notes]
    );
};

const getOrderById = async (orderId) => {
    const [order] = await pool.query(
        'SELECT * FROM orders WHERE order_id = ?', 
        [orderId]
    );
    return order[0];
};

const getOrderItems = async (orderId) => {
    const [items] = await pool.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        [orderId]
    );
    return items;
};

const getOrderStatusHistory = async (orderId) => {
    const [history] = await pool.query(
        'SELECT * FROM order_status_history WHERE order_id = ?',
        [orderId]
    );
    return history;
};

const updateOrderTotal = async (orderId) => {
    await pool.query(
        `UPDATE orders 
         SET total_amount = (
             SELECT SUM(subtotal) 
             FROM order_items 
             WHERE order_id = ?
         ) 
         WHERE order_id = ?`,
        [orderId, orderId]
    );
};

module.exports = {
    createOrder,
    addOrderItem,
    updateOrderStatus,
    getOrderById,
    getOrderItems,
    getOrderStatusHistory,
    updateOrderTotal
};