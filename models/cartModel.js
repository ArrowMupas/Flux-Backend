const pool = require('../database/pool');
const couponModel = require('./couponModel');

// Function to get a cart by user ID, optionally applying a coupon code
const getCartItemsByUserId = async (userId, couponCode = null) => {
    // If no couponCode provided, check if any cart item has a coupon_code saved
    let effectiveCouponCode = couponCode;
    if (!effectiveCouponCode) {
        const [[row]] = await pool.query(
            'SELECT coupon_code FROM cart WHERE user_id = ? AND coupon_code IS NOT NULL LIMIT 1',
            [userId]
        );
        if (row && row.coupon_code) {
            effectiveCouponCode = row.coupon_code;
        }
    }

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

    let discount = 0;
    let coupon = null;
    if (effectiveCouponCode) {
        coupon = await couponModel.findValidCoupon(effectiveCouponCode);
        if (coupon) {
            if (coupon.type === 'PERCENTAGE') {
                discount = (total.cart_total || 0) * coupon.amount / 100;
            } else if (coupon.type === 'FIXED') {
                discount = coupon.amount;
            }
        }
    }

    return {
        user_id: userId,
        cart_total: total.cart_total || 0,
        discount,
        total_after_discount: (total.cart_total || 0) - discount,
        coupon,
        items,
    };
};

// Function to get product stock by product ID
const getProductStock = async (connection, productId) => {
    const [rows] = await connection.query('SELECT stock_quantity FROM products WHERE id = ?', [
        productId,
    ]);
    return rows;
};

// Function to get a specific cart item by user ID and product ID
const getCartItem = async (connection, userId, productId) => {
    const [rows] = await connection.query(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
    );
    return rows;
};

// Function to insert a new cart item
const insertCartItem = async (connection, userId, productId, quantity) => {
    const [result] = await connection.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
    );
    return result;
};

// Function to update or insert cart item
const updateCartItem = async (connection, userId, productId, quantity, availableStock) => {
    const [result] = await connection.query(
        'UPDATE cart SET quantity = LEAST(quantity + ?, ?) WHERE user_id = ? AND product_id = ?',
        [quantity, availableStock, userId, productId]
    );
    return result;
};

// Function to update cart item quantity
const updateCartQuantity = async (connection, userId, productId, quantity, couponCode = null) => {
    const [result] = await connection.query(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
    );
    // If this is the main pool, return updated cart with discount
    if (connection === pool) {
        return await getCartItemsByUserId(userId, couponCode);
    }
    return result;
};

// Function to remove item from cart
const removeCartItem = async (userId, productId, couponCode = null) => {
    const [result] = await pool.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [
        userId,
        productId,
    ]);
    return await getCartItemsByUserId(userId, couponCode);
};

// Function to clear cart
const clearCart = async (userId, connection = pool, couponCode = null) => {
    const [result] = await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    // If this is the main pool, return updated cart with discount (should be empty)
    if (connection === pool) {
        return await getCartItemsByUserId(userId, couponCode);
    }
    return result;
};

// Apply coupon to user cart: only calculate discount, do not update cart items
const applyCouponToUserCart = async (userId, couponCode) => {
    const coupon = await couponModel.findValidCoupon(couponCode);
    if (!coupon) return { error: 'Invalid or expired coupon' };

    // Get all cart items for the user
    const [cartItems] = await pool.query(
        'SELECT id, quantity, product_id FROM cart WHERE user_id = ?',
        [userId]
    );
    if (cartItems.length === 0) return { error: 'Cart not found' };

    // Calculate cart total
    let cartTotal = 0;
    for (const item of cartItems) {
        const [[product]] = await pool.query(
            'SELECT price FROM products WHERE id = ?',
            [item.product_id]
        );
        cartTotal += item.quantity * product.price;
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = (cartTotal * coupon.amount) / 100;
    } else if (coupon.type === 'FIXED') {
        discount = coupon.amount;
    }

    // Persist coupon code and discount to all cart items for this user
    await pool.query(
        'UPDATE cart SET coupon_code = ?, discount_amount = ? WHERE user_id = ?',
        [couponCode, discount, userId]
    );

    return { success: true, coupon, cartTotal, discount, totalAfterDiscount: cartTotal - discount };
};

const applyCouponToCart = async (cartId, couponCode) => {
    const coupon = await couponModel.findValidCoupon(couponCode);
    if (!coupon) return { error: 'Invalid or expired coupon' };

    // Get the cart item
    const [[cartItem]] = await pool.query(
        'SELECT id, quantity, product_id FROM cart WHERE id = ?',
        [cartId]
    );
    if (!cartItem) return { error: 'Cart item not found' };

    // Get product price
    const [[product]] = await pool.query(
        'SELECT price FROM products WHERE id = ?',
        [cartItem.product_id]
    );

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = (cartItem.quantity * product.price * coupon.amount) / 100;
    } else if (coupon.type === 'FIXED') {
        discount = coupon.amount;
    }

    await pool.query(
        'UPDATE cart SET coupon_code = ?, discount_amount = ? WHERE id = ?',
        [couponCode, discount, cartId]
    );

    return { success: true, coupon };
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
    applyCouponToUserCart,
    applyCouponToCart, 
};
