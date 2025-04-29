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

module.exports = {
    createOrder,
    addOrderItem,
    updateOrderStatus
};