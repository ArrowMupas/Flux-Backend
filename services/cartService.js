const pool = require('../database/pool');
const cartModel = require('../models/cartModel');
const couponModel = require('../models/couponModel');
const HttpError = require('../helpers/errorHelper');

// Get or create cart for user
const getOrCreateCart = async (userId) => {
    let cart = await cartModel.getCartByUserId(userId);
    if (!cart) {
        await cartModel.createCart(userId);
        cart = await cartModel.getCartByUserId(userId);
    }
    return cart;
};

// Get all items in a cart
const getCartItemsByCartId = async (cartId) => {
    const cart = await cartModel.getCartItemsByCartId(cartId);

    if (cart?.coupon_code && cart?.user_id) {
        try {
            await applyCouponToCart(cart.user_id, cart.coupon_code);
            return await cartModel.getCartItemsByCartId(cartId);
        } catch (err) {
            console.warn('Coupon removed due to invalidation:', err.message);
            await cartModel.removeCouponFromCart(cart.user_id);
            return await cartModel.getCartItemsByCartId(cartId);
        }
    }

    return cart;
};

// Add product to cart
const addToCart = async (cartId, productId, quantity = 1) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const product = await cartModel.getProductStock(connection, productId);
        if (!product || product.length === 0) {
            throw new HttpError(404, 'Product not found');
        }

        const stockQty = product[0].stock_quantity;
        if (quantity > stockQty) {
            throw new HttpError(400, 'Requested quantity exceeds stock');
        }

        const existingItem = await cartModel.getCartItem(connection, cartId, productId);
        if (existingItem.length > 0) {
            // Update quantity by adding to existing
            const newQuantity = existingItem[0].quantity + quantity;
            if (newQuantity > stockQty) {
                throw new HttpError(400, 'Total quantity exceeds stock');
            }
            await cartModel.updateCartItem(connection, cartId, productId, newQuantity);
        } else {
            await cartModel.insertCartItem(connection, cartId, productId, quantity);
        }

        await connection.commit();
        return await getCartItemsByCartId(cartId);
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Update cart item quantity (directly sets it)
const updateCartItemQuantity = async (cartId, productId, quantity) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const product = await cartModel.getProductStock(connection, productId);
        if (!product || product.length === 0) {
            throw new HttpError(404, 'Product not found');
        }

        const stockQty = product[0].stock_quantity;

        if (quantity > stockQty) {
            throw new HttpError(400, 'Requested quantity exceeds stock');
        }

        let result;

        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            result = await cartModel.removeCartItemByCartId(connection, cartId, productId);
        } else {
            // Update quantity normally
            result = await cartModel.updateCartItem(connection, cartId, productId, quantity);
        }

        if (result.affectedRows === 0) {
            throw new HttpError(404, 'Cart item not found');
        }

        await connection.commit();
        return await getCartItemsByCartId(cartId);
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Remove a product from the cart
const removeCartItem = async (cartId, productId) => {
    const result = await cartModel.removeCartItem(cartId, productId);
    if (result.affectedRows === 0) {
        throw new HttpError(404, 'Cart item not found');
    }
    return result;
};

// Clear all items from the cart
const clearCart = async (cartId) => {
    const result = await cartModel.clearCart(cartId);
    if (result.affectedRows === 0) {
        throw new HttpError(404, 'Cart is already empty');
    }
    return result;
};

const applyCouponToCart = async (userId, code) => {
    const cart = await cartModel.getCartByUserId(userId);
    if (!cart) {
        throw new HttpError(404, 'Cart not found');
    }

    const cartData = await cartModel.getCartItemsByCartId(cart.id);
    if (!cartData.items || cartData.items.length === 0) {
        throw new HttpError(400, 'Cannot apply a coupon to an empty cart');
    }

    const coupon = await couponModel.getCouponByCode(code);
    if (!coupon || !coupon.is_active) {
        throw new HttpError(400, 'Invalid or inactive coupon');
    }

    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
        throw new HttpError(400, 'This coupon has reached its usage limit.');
    }

    const now = new Date();
    const startsAt = coupon.starts_at && new Date(coupon.starts_at);
    const expiresAt = coupon.expires_at && new Date(coupon.expires_at);

    if ((startsAt && now < startsAt) || (expiresAt && now > expiresAt)) {
        throw new HttpError(400, 'Coupon is not valid at this time');
    }

    if (coupon.per_user_limit) {
        const usageCount = await couponModel.getUserCouponUsageCount(userId, code);
        if (usageCount >= coupon.per_user_limit) {
            throw new HttpError(
                400,
                'You have already used this coupon the maximum number of times allowed.'
            );
        }
    }

    const cartTotal = await cartModel.getCartTotal(userId);

    let discount = 0;
    if (coupon.discount_type === 'fixed') {
        discount = coupon.discount_value;
    } else if (coupon.discount_type === 'percentage') {
        discount = (cartTotal * coupon.discount_value) / 100;
    }

    discount = Math.min(discount, cartTotal);

    await cartModel.updateCartCoupon(userId, {
        coupon_code: code,
        discount_total: discount,
    });

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
    const cart = await cartModel.getCartByUserId(userId);
    if (!cart) {
        throw new HttpError(404, 'Cart not found');
    }

    await cartModel.removeCouponFromCart(userId);

    // Get updated cart info
    return await cartModel.getCartItemsByCartId(cart.id);
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
