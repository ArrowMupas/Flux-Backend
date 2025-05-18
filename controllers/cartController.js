const cartModel = require('../models/cartModel');
const sendResponse = require('../middlewares/responseMiddleware');
const asyncHandler = require('express-async-handler');
const HttpError = require('../helpers/errorHelper');

// Get all cart items by user ID
const getCartItems = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const cartItems = await cartModel.getCartItemsByUserId(userId);

    // Return error if cart has no items
    if (!cartItems.items || cartItems.items.length === 0) {
        throw new HttpError(404, 'No items found in the cart');
    }

    return sendResponse(res, 200, 'Cart fetched.', cartItems);
});

// Add to cart
const addToCart = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId, quantity } = req.body;

    // Validate input fields
    if (!productId || !quantity) {
        throw new HttpError(404, `Product and quantity are required`);
    }

    const result = await cartModel.addToCart(userId, productId, quantity);

    if (result.affectedRows === 0) {
        throw new HttpError(400, `Failed to add item to cart`);
    }

    return sendResponse(res, 201, 'Added to cart', result);
});

// Update cart item quantity
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId, quantity } = req.body;

    // Validate input fields
    if (!productId || !quantity) {
        throw new HttpError(404, `Product and quantity are required`);
    }

    const result = await cartModel.updateCartItemQuantity(userId, productId, quantity);

    if (result.affectedRows === 0) {
        throw new HttpError(400, `Failed to update cart`);
    }

    return sendResponse(res, 200, 'Cart Updated', result);
});

// Remove item from cart
const removeCartItem = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId } = req.body;
    const result = await cartModel.removeCartItem(userId, productId);

    if (result.affectedRows === 0) {
        throw new HttpError(404, `Cannot find product with ID ${productId} in the cart`);
    }

    return sendResponse(res, 201, 'Item removed from cart', result);
});

// Clear all item from a user cart
const clearCart = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const result = await cartModel.clearCart(userId);

    if (result.affectedRows === 0) {
        throw new HttpError(404, `No items to clear in cart`);
    }

    return sendResponse(res, 200, 'Cart cleared.', []);
});

module.exports = {
    getCartItems,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
