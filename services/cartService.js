const pool = require('../database/pool');
const cartModel = require('../models/cartModel');
const couponModel = require('../models/couponModel');
const HttpError = require('../helpers/errorHelper');

// Get or create a cart for a specific user.
const getOrCreateCart = async (userId) => {
    let cart = await cartModel.getCartByUserId(userId);

    // Create cart if not found
    if (!cart) {
        await cartModel.createCart(userId);
        cart = await cartModel.getCartByUserId(userId);
    }

    return cart;
};

const getCartItemsByCartId = async (cartId) => {
    const cart = await cartModel.getCartItemsByCartId(cartId);
    if (!cart) {
        throw new HttpError(404, 'Cart not found');
    }

    return cart;
};

const addToCart = async (cartId, productId, quantity = 1) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Fetch product stock
        const product = await cartModel.getProductStock(connection, productId);
        if (!product || product.length === 0) {
            throw new HttpError(404, 'Product not found');
        }
        // Save stock here
        const stockQty = product[0].stock_quantity;

        // Fetch cart items
        const existingItem = await cartModel.getCartItem(connection, cartId, productId);

        if (existingItem.length > 0) {
            // Update quantity if item already exists
            const newQuantity = existingItem[0].quantity + quantity;
            if (newQuantity > stockQty) throw new HttpError(400, 'Total quantity exceeds stock');
            await cartModel.updateCartItem(connection, cartId, productId, newQuantity);
        } else {
            // Insert new cart item
            if (quantity > stockQty) throw new HttpError(400, 'Requested quantity exceeds stock');
            await cartModel.insertCartItem(connection, cartId, productId, quantity);
        }

        await connection.commit();

        const cart = await cartModel.getCartById(connection, cartId);

        // Reapply coupon if it exists
        if (cart.coupon_code) {
            await applyCouponToCart(cart.user_id, cart.coupon_code);
        }

        return { message: 'Item added to cart successfully' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const updateCartItemQuantity = async (cartId, productId, quantity) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Fetch product stock
        const product = await cartModel.getProductStock(connection, productId);
        if (!product || product.length === 0) {
            throw new HttpError(404, 'Product not found');
        }
        const stockQty = product[0].stock_quantity;

        if (quantity > stockQty) {
            throw new HttpError(400, 'Requested quantity exceeds stock');
        }

        if (quantity <= 0) {
            // Remove item if quantity is zero or negative
            await cartModel.removeCartItemByCartId(connection, cartId, productId);
        } else {
            const result = await cartModel.updateCartItem(connection, cartId, productId, quantity);
            if (result.affectedRows === 0) throw new HttpError(404, 'Cart item not found');
        }

        await connection.commit();

        const cart = await cartModel.getCartById(connection, cartId);

        // Reapply coupon if it exists
        if (cart.coupon_code) {
            await applyCouponToCart(cart.user_id, cart.coupon_code);
        }

        return { message: 'Cart updated successfully' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Removes a single item from cart
const removeCartItem = async (cartId, productId) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Remove the cart item
        const result = await cartModel.removeCartItemByCartId(connection, cartId, productId);
        if (result.affectedRows === 0) throw new HttpError(404, 'Cart item not found');

        // Now fetch the updated cart
        const updatedCart = await cartModel.getCartById(connection, cartId);
        if (!updatedCart) throw new HttpError(404, 'Cart not found');

        // Reapply coupon if it exists
        if (updatedCart.coupon_code) {
            try {
                await applyCouponToCart(updatedCart.user_id, updatedCart.coupon_code, connection);
            } catch (err) {
                console.warn('Coupon removed due to invalidation:', err.message);
                await cartModel.removeCouponFromCart(connection, updatedCart.user_id);
            }
        }

        await connection.commit();
        return { message: 'Item removed from cart successfully' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const clearCart = async (cartId, connection = null) => {
    const useTransaction = !!connection;
    const conn = connection || (await pool.getConnection());

    if (!useTransaction) await conn.beginTransaction();

    try {
        // Clear the cart
        const result = await cartModel.clearCart(conn, cartId);
        if (result.affectedRows === 0) throw new HttpError(404, 'Cart is already empty');

        //. refetch cart, and also clear the coupon
        const cart = await cartModel.getCartById(conn, cartId);
        if (cart && cart.coupon_code) {
            await cartModel.removeCouponFromCart(conn, cart.user_id);
        }

        if (!useTransaction) await conn.commit();

        return { message: 'Cart cleared successfully' };
    } catch (err) {
        if (!useTransaction) await conn.rollback();
        throw err;
    } finally {
        if (!useTransaction) conn.release();
    }
};

const applyCouponToCart = async (userId, code, connection = null) => {
    const conn = connection || pool;

    // fetch cart
    const cart = await cartModel.getCartByUserIdTransaction(conn, userId);
    if (!cart) throw new HttpError(404, 'Cart not found');

    const cartData = await cartModel.getCartItemsByCartIdTransaction(conn, cart.id);
    if (!cartData.items || cartData.items.length === 0) {
        throw new HttpError(400, 'Cannot apply a coupon to an empty cart');
    }

    // fetch coupon
    const coupon = await couponModel.getCouponByCode(conn, code);
    if (!coupon || !coupon.is_active) throw new HttpError(400, 'Invalid or inactive coupon');

    // Validate coupon usage limits
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
        throw new HttpError(400, 'This coupon has reached its usage limit.');
    }

    // Validate coupon per user limit
    if (coupon.per_user_limit) {
        const usageCount = await couponModel.getUserCouponUsageCount(conn, userId, code);
        if (usageCount >= coupon.per_user_limit) {
            throw new HttpError(400, 'You have already used this coupon the maximum number of times allowed.');
        }
    }

    const cartTotal = await cartModel.getCartTotal(conn, userId);

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'fixed') discount = coupon.discount_value;
    else if (coupon.discount_type === 'percentage') {
        discount = (cartTotal * coupon.discount_value) / 100;
    }
    discount = Math.min(discount, cartTotal);

    await cartModel.updateCartCoupon(conn, userId, { coupon_code: code, discount_total: discount });

    return {
        coupon: {
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
        },
        discount,
        cartTotal,
        finalTotal: cartTotal - discount,
    };
};

const removeCoupon = async (userId) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const cart = await cartModel.getCartByUserIdTransaction(connection, userId);
        if (!cart) throw new HttpError(404, 'Cart not found');

        await cartModel.removeCouponFromCart(connection, userId);

        await connection.commit();

        return { message: 'Coupon removed successfully' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    getOrCreateCart,
    getCartItemsByCartId,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    applyCouponToCart,
    removeCoupon,
};
