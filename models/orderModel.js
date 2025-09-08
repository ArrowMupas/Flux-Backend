const pool = require('../database/pool');

const createOrder = async (orderData, connection = pool) => {
    const [result] = await connection.query(`INSERT INTO orders SET ?`, orderData);
    return orderData.id;
};

// Function to add order items
const addOrderItem = async (itemData, connection = pool) => {
    const [result] = await connection.query(`INSERT INTO order_items SET ?`, itemData);
    return result.insertId;
};

// Function to get order items
const getOrderItems = async (orderId) => {
    const [items] = await pool.query(
        `
    SELECT 
      oi.*, 
      p.name AS product_name,
      p.category,
      p.description,
      p.image
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `,
        [orderId]
    );

    return items;
};

// Function to get order by ID
const getOrderById = async (orderId) => {
    const [rows] = await pool.query(
        `
    SELECT o.*, 
    p.method AS payment_method,
    p.reference_number,
    p.account_name,
    p.address
    FROM orders o
    LEFT JOIN payments p ON o.id = p.order_id
    WHERE o.id = ?
    `,
        [orderId]
    );
    return rows[0] ?? null;
};

// Function to get order by user and status
const getOrdersByUserAndStatus = async (userId, status) => {
    const [rows] = await pool.query(
        `
    SELECT 
      o.*, 
      p.method AS payment_method
    FROM orders o
    LEFT JOIN payments p ON o.id = p.order_id
    WHERE o.customer_id = ? AND o.status = ?
  `,
        [userId, status]
    );

    return rows;
};

// Function to get all orders by user
const getAllOrdersByUser = async (userId) => {
    const [rows] = await pool.query(
        `SELECT 
            o.*, 
            p.method AS payment_method
            FROM orders o
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE o.customer_id = ?
        `,
        [userId]
    );
    return rows;
};

const getFilteredOrders = async (userId, statuses = [], paymentMethods = [], monthYear = null) => {
    let query = `
        SELECT 
            o.*, 
            p.method AS payment_method
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE o.customer_id = ?
    `;

    const params = [userId];

    // Add filters dynamically
    if (statuses.length) {
        query += ` AND o.status IN (${statuses.map(() => '?').join(',')})`;
        params.push(...statuses);
    }

    if (paymentMethods.length) {
        query += ` AND p.method IN (${paymentMethods.map(() => '?').join(',')})`;
        params.push(...paymentMethods);
    }

    if (monthYear) {
        // format is 'YYYY-MM'
        query += ` AND DATE_FORMAT(o.order_date, '%Y-%m') = ?`;
        params.push(monthYear);
    }

    // Sort by newest first
    query += ` ORDER BY o.order_date DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
};

// Function to create initial order status
const createOrderStatus = async ({ orderId, newStatus, notes }, connection = pool) => {
    await connection.query(`UPDATE orders SET status = ? WHERE id = ?`, [newStatus, orderId]);

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
    await connection.query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [orderId]);

    // Log the cancel on status history
    await connection.query(`INSERT INTO order_status_history (order_id, status, notes) VALUES (?, 'cancelled', ?)`, [
        orderId,
        notes,
    ]);
};

// Function to cancel order
const createCancelRequest = async (orderId, notes, connection = pool) => {
    await connection.query(`UPDATE orders SET cancel_requested = TRUE WHERE id = ?`, [orderId]);

    // Log the cancel on status history
    await connection.query(
        `INSERT INTO order_status_history (order_id, status, notes) VALUES (?, 'cancel_requested', ?)`,
        [orderId, notes]
    );
};

// Function to get today's order count for a user
const getTodayOrderCountByUser = async (userId, connection = pool) => {
    const [[{ count }]] = await connection.query(
        `
    SELECT COUNT(*) AS count
    FROM orders
    WHERE customer_id = ?
      AND DATE(order_date) = CURDATE()
  `,
        [userId]
    );
    return count;
};

// Function to create a reservation for a product
const createReservation = async (product_id, order_id, quantity, connection = pool) => {
    await connection.query(
        `
    INSERT INTO product_reservations (product_id, order_id, quantity)
    VALUES (?, ?, ?)
  `,
        [product_id, order_id, quantity]
    );
};

// Function to get reserved quantity for a product
const getReservedQuantityByProductId = async (product_id, connection = pool) => {
    const [[{ reserved }]] = await connection.query(
        `
    SELECT IFNULL(SUM(quantity), 0) AS reserved
    FROM product_reservations
    WHERE product_id = ?
  `,
        [product_id]
    );
    return reserved;
};

// Function to deduct stock for an order
const deductStockForOrder = async (order_id, connection = pool) => {
    await connection.query(
        `
    UPDATE products p
    JOIN product_reservations r ON p.id = r.product_id
    SET p.stock_quantity = p.stock_quantity - r.quantity
    WHERE r.order_id = ?
  `,
        [order_id]
    );
};

// Function to delete reservations by order ID
const deleteReservationsByOrderId = async (order_id, connection = pool) => {
    await connection.query(
        `
    DELETE FROM product_reservations
    WHERE order_id = ?
  `,
        [order_id]
    );
};

module.exports = {
    createOrder,
    addOrderItem,
    createOrderStatus,
    getOrderById,
    getOrderItems,
    getFilteredOrders,
    getOrderStatusHistory,
    getOrdersByUserAndStatus,
    getAllOrdersByUser,
    cancelOrder,
    createCancelRequest,
    getTodayOrderCountByUser,
    createReservation,
    getReservedQuantityByProductId,
    deductStockForOrder,
    deleteReservationsByOrderId,
};
