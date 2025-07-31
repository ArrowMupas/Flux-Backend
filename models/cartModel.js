const pool = require('../database/pool');

// ✅ Get cart for user (returns a single cart or null)
const getCartByUserId = async (userId) => {
    const [rows] = await pool.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    return rows[0];
};

const getCartById = async (connection = pool, cartId) => {
    const [rows] = await connection.query('SELECT * FROM carts WHERE id = ?', [cartId]);
    return rows[0];
};

// ✅ Create a new cart for user
const createCart = async (userId) => {
    const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.insertId;
};

const getCartItemsByCartId = async (cartId) => {
    // Get cart items and product details
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

    // Get total price
    const [[total]] = await pool.query(
        `SELECT SUM(ci.quantity * p.price) AS cart_total
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ?`,
        [cartId]
    );

    const cart_total = parseFloat(total?.cart_total || 0);

    // Get cart info (for coupon and discount)
    const [[cartInfo]] = await pool.query(
        `SELECT user_id, coupon_code, discount_total
        FROM carts
        WHERE id = ?`,
        [cartId]
    );

    const discount = parseFloat(cartInfo?.discount_total || 0);
    const coupon_code = cartInfo?.coupon_code || null;
    const user_id = cartInfo?.user_id || null;

    return {
        cart_id: cartId,
        cart_total,
        coupon_code,
        discount,
        final_total: Math.max(cart_total - discount, 0),
        items,
        user_id,
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

const updateCartCoupon = async (userId, { coupon_code, discount_total }) => {
    await pool.query(
        `UPDATE carts
         SET coupon_code = ?, discount_total = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [coupon_code, discount_total, userId]
    );
};

// Assumes you already have cart items with quantity & price
const getCartTotal = async (userId) => {
    const [rows] = await pool.query(
        `
        SELECT SUM(ci.quantity * p.price) AS total
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id
        WHERE c.user_id = ?
        `,
        [userId]
    );

    return rows[0]?.total || 0;
};

const removeCouponFromCart = async (userId) => {
    await pool.query(
        `UPDATE carts
         SET coupon_code = NULL,
             discount_total = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [userId]
    );
};

module.exports = {
    getCartByUserId,
    getCartById,
    createCart,
    getCartItemsByCartId,
    getProductStock,
    getCartItem,
    insertCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    updateCartCoupon,
    getCartTotal,
    removeCouponFromCart,
};
