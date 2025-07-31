const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const cartService = require('../services/cartService');
const cartModel = require('../models/cartModel');
const HttpError = require('../helpers/errorHelper');

// Get all cart items by user ID
const getCartItems = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const cart = await cartService.getOrCreateCart(userId); // new helper

    const cartItems = await cartService.getCartItemsByCartId(cart.id);
    return sendResponse(res, 200, 'Cart retrieved.', cartItems);
});

// Add to cart
const addToCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const cart = await cartService.getOrCreateCart(userId);
    const result = await cartService.addToCart(cart.id, productId, quantity);

    return sendResponse(res, 201, 'Added to cart', result);
});

// Update cart item quantity
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const cart = await cartService.getOrCreateCart(userId);
    const result = await cartService.updateCartItemQuantity(cart.id, productId, quantity);

    return sendResponse(res, 200, 'Cart updated', result);
});

// Remove item from cart
const removeCartItem = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;

    const cart = await cartService.getOrCreateCart(userId);
    const result = await cartService.removeCartItem(cart.id, productId);

    return sendResponse(res, 201, 'Item removed from cart', result);
});

// Clear all item from a user cart
const clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const cart = await cartService.getOrCreateCart(userId);
    const result = await cartService.clearCart(cart.id);

    return sendResponse(res, 200, 'Cart cleared.', result);
});

module.exports = {
    getCartItems,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
