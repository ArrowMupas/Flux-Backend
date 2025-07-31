const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const cartService = require('../services/cartService');

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

const applyCouponToCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { coupon_code } = req.body;

    const result = await cartService.applyCouponToCart(userId, coupon_code);

    return sendResponse(res, 200, 'Coupon applied to cart', result);
});

const removeCoupon = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const updatedCart = await cartService.removeCoupon(userId);

    return sendResponse(res, 200, 'Coupon removed from cart', updatedCart);
});

module.exports = {
    getCartItems,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    applyCouponToCart,
    removeCoupon,
};
