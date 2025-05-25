const pool = require('../database/pool');

// Function to get a cart by user ID
const getCartItemsByUserId = async (userId) => {
    const [items] = await pool.query(
        `SELECT 
         cart.id AS cart_item_id,
         cart.quantity,
         products.id AS product_id,
         products.name,
         products.price,
         products.image,
         products.stock_quantity,
         products.description
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = ?`,
        [userId]
    );

    // Calculate total cart price
    const [[total]] = await pool.query(
        `SELECT 
         SUM(cart.quantity * products.price) AS cart_total
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.user_id = ?`,
        [userId]
    );

    return {
        user_id: userId,
        cart_total: total.cart_total || 0,
        items,
    };
};

const getProductStock = async (connection, productId) => {
    const [rows] = await connection.query('SELECT stock_quantity FROM products WHERE id = ?', [
        productId,
    ]);
    return rows;
};

const getCartItem = async (connection, userId, productId) => {
    const [rows] = await connection.query(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
    );
    return rows;
};

const updateCartItem = async (connection, userId, productId, quantity, availableStock) => {
    const [result] = await connection.query(
        'UPDATE cart SET quantity = LEAST(quantity + ?, ?) WHERE user_id = ? AND product_id = ?',
        [quantity, availableStock, userId, productId]
    );
    return result;
};

const insertCartItem = async (connection, userId, productId, quantity) => {
    const [result] = await connection.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
    );
    return result;
};

const updateCartQuantity = async (connection, userId, productId, quantity) => {
    const [result] = await connection.query(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
    );
    return result;
};

// Function to remove item from cart
const removeCartItem = async (userId, productId) => {
    const [result] = await pool.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [
        userId,
        productId,
    ]);
    return await getCartItemsByUserId(userId);
};

// Function to clear cart
const clearCart = async (userId, connection = pool) => {
    const [result] = await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    return result;
};

module.exports = {
    getCartItemsByUserId,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    getProductStock,
    getCartItem,
    updateCartItem,
    insertCartItem,
};
