const pool = require('../database/pool');
const SQL = require('sql-template-strings');

const getCartItemsByCartId = async (cartId) => {
    const [rows] = await pool.query(SQL`
        SELECT 
            c.id AS cart_id,
            c.user_id,
            c.coupon_code,
            c.discount_total,
            ci.id AS cart_item_id,
            ci.quantity,
            ci.updated_at,
            p.id AS product_id,
            p.name,
            p.price,
            p.image,
            p.stock_quantity,
            p.description
        FROM carts c
        LEFT JOIN cart_items ci ON ci.cart_id = c.id
        LEFT JOIN products p ON ci.product_id = p.id
        WHERE c.id = ${cartId}
    `);

    return rows;
};

const getCartItemsByCartIdTransaction = async (connection, cartId) => {
    // Get cart items and product details
    const [items] = await connection.query(
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

const getCartItemsWithDetails = async (cartId) => {
    const [rows] = await pool.query(SQL`
        SELECT 
            ci.id AS cart_item_id,
            ci.quantity,
            ci.updated_at AS item_updated_at,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            p.stock_quantity AS product_stock,
            p.description AS product_description,
            SUM(ci.quantity * p.price) OVER (PARTITION BY ci.cart_id) AS cart_total
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = ${cartId}
    `);

    return rows;
};

const insertCartItem = async (connection, cartId, productId, quantity) => {
    const [result] = await connection.query(SQL`
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (${cartId}, ${productId}, ${quantity})
    `);
    return result;
};

const updateCartItem = async (connection, cartId, productId, quantity) => {
    const [result] = await connection.query(SQL`
        UPDATE cart_items
        SET quantity = ${quantity}, updated_at = CURRENT_TIMESTAMP
        WHERE cart_id = ${cartId} AND product_id = ${productId}
    `);
    return result;
};

const removeCartItemByCartId = async (connection, cartId, productId) => {
    const [result] = await connection.query(SQL`
        DELETE FROM cart_items
        WHERE cart_id = ${cartId} AND product_id = ${productId}
    `);
    return result;
};

//
//  Get cart for user (returns a single cart or null)
const getCartByUserId = async (userId, connection = pool) => {
    const [rows] = await connection.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    return rows[0];
};

const getCartByUserIdTransaction = async (connection, userId) => {
    const [rows] = await connection.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    return rows[0];
};

const getCartById = async (connection, cartId) => {
    const [rows] = await connection.query('SELECT * FROM carts WHERE id = ?', [cartId]);
    return rows[0];
};

//  Create a new cart for user
const createCart = async (userId) => {
    const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.insertId;
};

//  Get product stock (uses given connection)
const getProductStock = async (connection, productId) => {
    const [rows] = await connection.query('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
    return rows;
};

//  Get a specific cart item by cart + product
const getCartItem = async (connection, cartId, productId) => {
    const [rows] = await connection.query('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', [
        cartId,
        productId,
    ]);
    return rows;
};

//  Remove one item from the cart
const removeCartItem = async (cartId, productId) => {
    const [result] = await pool.query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [
        cartId,
        productId,
    ]);
    return result;
};

//  Clear all items in the cart
const clearCart = async (connection, cartId) => {
    const [result] = await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    return result;
};

const updateCartCoupon = async (connection, userId, { coupon_code, discount_total }) => {
    await connection.query(
        `UPDATE carts
         SET coupon_code = ?, discount_total = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [coupon_code, discount_total, userId]
    );
};

// Assumes you already have cart items with quantity & price
const getCartTotal = async (connection, userId) => {
    const [rows] = await connection.query(
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

const removeCouponFromCart = async (connection, userId) => {
    await connection.query(
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
    removeCartItemByCartId,
    getCartByUserIdTransaction,
    getCartItemsByCartIdTransaction,
    getCartItemsWithDetails,
};
