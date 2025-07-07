const cartModel = require('../models/cartModel');
const pool = require('../database/pool');
const HttpError = require('../helpers/errorHelper');

// Logic of getting orders
const getCartItems = async (userId) => {
    const cartItems = await cartModel.getCartItemsByUserId(userId);

    return cartItems;
};

// Logic of adding item to cart
const addToCart = async (userId, productId, quantity = 1) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const product = await cartModel.getProductStock(connection, productId);

        if (product.length === 0) {
            throw new HttpError(404, 'Product not found');
        }

        const availableStock = product[0].stock_quantity;

        if (quantity > availableStock) {
            throw new HttpError(400, 'Requested quantity exceeds stock');
        }

        const existing = await cartModel.getCartItem(connection, userId, productId);

        if (existing.length > 0) {
            await cartModel.updateCartItem(connection, userId, productId, quantity, availableStock);
        } else {
            await cartModel.insertCartItem(connection, userId, productId, quantity);
        }

        await connection.commit();
        return await cartModel.getCartItemsByUserId(userId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Logic of updating cart item quantity
const updateCartItemQuantity = async (userId, productId, quantity) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const product = await cartModel.getProductStock(connection, productId);

        if (product.length === 0) {
            throw new HttpError(404, 'Product not found');
        }

        const availableStock = product[0].stock_quantity;

        if (quantity > availableStock) {
            throw new HttpError(400, 'Requested quantity exceeds stock');
        }

        const result = await cartModel.updateCartQuantity(connection, userId, productId, quantity);

        if (result.affectedRows === 0) {
            throw new HttpError(400, 'Cart item not found or no changes made.');
        }

        await connection.commit();
        const updatedCart = await cartModel.getCartItemsByUserId(userId);
        return updatedCart;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Logic of getting orders
const removeCartItem = async (userId, productId) => {
    const result = await cartModel.removeCartItem(userId, productId);

    if (result.affectedRows === 0) {
        throw new HttpError(404, 'Product not found');
    }

    return result;
};

// Logic of getting orders
const clearCart = async (userId) => {
    const result = await cartModel.clearCart(userId);

    if (result.affectedRows === 0) {
        throw new HttpError(404, `No items to clear in cart`);
    }

    return result;
};

module.exports = { getCartItems, addToCart, updateCartItemQuantity, removeCartItem, clearCart };
