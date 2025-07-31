const pool = require('../database/pool');

// ✅ Get cart for user (returns a single cart or null)
const getCartByUserId = async (userId) => {
    const [rows] = await pool.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    return rows[0];
};

// ✅ Create a new cart for user
const createCart = async (userId) => {
    const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.insertId;
};

// ✅ Get all items in a cart by cart_id
const getCartItemsByCartId = async (cartId) => {
    const [items] = await pool.query(
        `SELECT 
            ci.id AS cart_item_id,
            ci.quantity,
            ci.updated_at,
            p.id AS product_id,
            p.name,
            p.price,
            p.image,
            p.stock_quantity,
            p.description
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ?`,
        [cartId]
    );

    const [[total]] = await pool.query(
        `SELECT SUM(ci.quantity * p.price) AS cart_total
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ?`,
        [cartId]
    );

    return {
        cart_id: cartId,
        cart_total: total?.cart_total || 0,
        items,
    };
};

// ✅ Get product stock (uses given connection)
const getProductStock = async (connection, productId) => {
    const [rows] = await connection.query('SELECT stock_quantity FROM products WHERE id = ?', [
        productId,
    ]);
    return rows;
};

// ✅ Get a specific cart item by cart + product
const getCartItem = async (connection, cartId, productId) => {
    const [rows] = await connection.query(
        'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cartId, productId]
    );
    return rows;
};

// ✅ Insert a new item into cart
const insertCartItem = async (connection, cartId, productId, quantity) => {
    const [result] = await connection.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, productId, quantity]
    );
    return result;
};

// ✅ Update cart item quantity (overwrite)
const updateCartItem = async (connection, cartId, productId, quantity) => {
    const [result] = await connection.query(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?',
        [quantity, cartId, productId]
    );
    return result;
};

// ✅ Remove one item from the cart
const removeCartItem = async (cartId, productId) => {
    const [result] = await pool.query(
        'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cartId, productId]
    );
    return result;
};

// ✅ Clear all items in the cart
const clearCart = async (cartId) => {
    const [result] = await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    return result;
};

module.exports = {
    getCartByUserId,
    createCart,
    getCartItemsByCartId,
    getProductStock,
    getCartItem,
    insertCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
};
