const pool = require('../database/pool');

// Function to get all orders with optional filters
const getOrders = async (status = null, start = null, end = null) => {
    end = `${end} 23:59:59`;

    let query = `
        SELECT 
            o.*, 
            p.method AS payment_method, 
            u.username, 
            u.email
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        JOIN users u ON o.customer_id = u.id
    `;

    const queryParams = [];
    const conditions = [];

    if (status) {
        conditions.push(`o.status = ?`);
        queryParams.push(status);
    }

    if (start && end) {
        conditions.push(`o.order_date BETWEEN ? AND ?`);
        queryParams.push(start, end);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY o.order_date DESC`;

    const [rows] = await pool.query(query, queryParams);
    return rows;
};

// Function to get order
const getOrderById = async (orderId) => {
    const [rows] = await pool.query(
        `
        SELECT 
            o.*, 
            p.method AS payment_method,
            p.reference_number,
            p.account_name,
            u.id AS user_id,
            u.username,
            u.email,
            u.contact_number,
            u.address,
            s.shipping_price,
            s.shipping_company,
            s.order_reference_number AS shipping_reference
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN shipping s ON o.id = s.order_id
        WHERE o.id = ?
        `,
        [orderId]
    );
    return rows[0];
};

// Function to get order items
const getOrderItems = async (orderId) => {
    const [items] = await pool.query(
        `
    SELECT 
      oi.*, 
      pr.name AS product_name,
      pr.image AS product_image
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
    const [rows] = await pool.query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY status_date ASC', [
        orderId,
    ]);
    return rows;
};

// Function to change status of an order
const changeOrderStatus = async (orderId, newStatus, notes, connection = pool) => {
    await connection.query(`UPDATE orders SET status = ? WHERE id = ?`, [newStatus, orderId]);

    // Log the change on status history
    await connection.query(`INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)`, [
        orderId,
        newStatus,
        notes,
    ]);
};

const addShippingRecord = async (orderId, shippingPrice, shippingCompany, orderReferenceNumber, connection = pool) => {
    await connection.query(
        `INSERT INTO shipping (order_id, shipping_price, shipping_company, order_reference_number)
         VALUES (?, ?, ?, ?)`,
        [orderId, shippingPrice, shippingCompany, orderReferenceNumber]
    );
};

module.exports = {
    getOrders,
    getOrderById,
    getOrderItems,
    getAllOrdersByUser,
    getOrderStatusHistory,
    changeOrderStatus,
    addShippingRecord,
};
