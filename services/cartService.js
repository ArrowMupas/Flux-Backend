const pool = require('../database/pool');
const cartModel = require('../models/cartModel');
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
    return await cartModel.getCartItemsByCartId(cartId);
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
        return await cartModel.getCartItemsByCartId(cartId);
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
        return await cartModel.getCartItemsByCartId(cartId);
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

module.exports = {
    getOrCreateCart,
    getCartItemsByCartId,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
