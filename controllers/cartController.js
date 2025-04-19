const cartModel = require('../models/cartModel');
const sendResponse = require('../middlewares/responseMiddleware');
const asyncHandler = require('express-async-handler');

// Get all cart items by user ID
const getCartItems = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const cartItems = await cartModel.getCartItemsByUserId(userId);

    // Return error if cart has no items
    if (!cartItems || cartItems.length === 0) {
        res.status(404).json({ message: 'No items found in the cart.' });
        return;
    }

    return sendResponse(res, 200, 'Cart fetched.', cartItems);
});

// Add to cart
const addToCart = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId, quantity } = req.body;

    // Validate input fields
    if (!productId || !quantity) {
        res.status(400).json({ message: 'Product ID and quantity are required.' });
        return;
    }

    const result = await cartModel.addToCart(userId, productId, quantity);

    if (result.affectedRows === 0) {
        res.status(400).json({ message: 'Failed to add item to cart.' });
        return;
    }

    return sendResponse(res, 201, 'Added to cart', result);
});

// Update cart item quantity
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId, quantity } = req.body;

    // Validate input fields
    if (!productId || !quantity) {
        res.status(400).json({ message: 'Product ID and quantity are required.' });
        return;
    }

    const result = await cartModel.updateCartItemQuantity(userId, productId, quantity);

    if (result.affectedRows === 0) {
        res.status(400).json({ message: 'Failed to update cart.' });
        return;
    }

    return sendResponse(res, 200, 'Cart Updated', result);
});

// Remove item from cart
const removeCartItem = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { productId } = req.body;
    const result = await cartModel.removeCartItem(userId, productId);

    if (result.affectedRows === 0) {
        res.status(404);
        throw new Error(`Cannot find product with ID ${productId} in the cart`);
    }

    return sendResponse(res, 201, 'Item removed from cart', result);
});

// Clear all item from a user cart
const clearCart = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const result = await cartModel.clearCart(userId);

    if (result.affectedRows === 0) {
        res.status(404);
        throw new Error('No items found in the cart to clear.');
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
