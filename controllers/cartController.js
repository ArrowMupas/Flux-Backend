const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const cartService = require('../services/cartService');

// Get all cart items by user ID
const getCartItems = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const cartItems = await cartService.getCartItems(userId);
    return sendResponse(res, 200, 'Cart retrieved.', cartItems);
});

// Add to cart
const addToCart = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId, quantity } = req.body;
    const result = await cartService.addToCart(userId, productId, quantity);
    return sendResponse(res, 201, 'Added to cart', result);
});

// Update cart item quantity
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId, quantity } = req.body;
    const result = await cartService.updateCartItemQuantity(userId, productId, quantity);
    return sendResponse(res, 200, 'Cart Updated', result);
});

// Remove item from cart
const removeCartItem = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId } = req.body;
    const result = await cartService.removeCartItem(userId, productId);
    return sendResponse(res, 201, 'Item removed from cart', result);
});

// Clear all item from a user cart
const clearCart = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const result = await cartService.clearCart(userId);
    return sendResponse(res, 200, 'Cart cleared.', result);
});

module.exports = {
    getCartItems,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
