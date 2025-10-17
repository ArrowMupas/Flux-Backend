const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const wishlistModel = require('../models/wishlistModel');
const HttpError = require('../helpers/errorHelper');

// Add product to wishlist
const addToWishlist = asyncHandler(async (req, res) => {
    const { product_id } = req.body;
    const user_id = req.user.id;

    if (!product_id) throw new HttpError(400, 'Product ID is required');

    const updatedCount = await wishlistModel.addWishlistItem({ user_id, product_id });
    return sendResponse(res, 201, 'Product added to wishlist', { wishlist_count: updatedCount });
});

// Remove product from wishlist
const removeFromWishlist = asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    const user_id = req.user.id;

    if (!product_id) throw new HttpError(400, 'Product ID is required');

    const updatedCount = await wishlistModel.removeWishlistItem({ user_id, product_id });
    if (updatedCount === null) throw new HttpError(404, 'Product not found in wishlist');

    return sendResponse(res, 200, 'Product removed from wishlist', { wishlist_count: updatedCount });
});

// Check if product is in wishlist
const isInTheWishlist = asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    const user_id = req.user.id;

    if (!product_id) throw new HttpError(400, 'Product ID is required');

    const wishlist = await wishlistModel.getWishlistByUser(user_id);
    const inWishlist = wishlist.some(item => item.product_id === product_id);

    return sendResponse(res, 200, 'Wishlist check completed!', { inWishlist });
});

// Get user's wishlist
const getUserWishlist = asyncHandler(async (req, res) => {
    const user_id = req.user.id;
    const wishlist = await wishlistModel.getWishlistByUser(user_id);
    return sendResponse(res, 200, 'Wishlist retrieved', wishlist);
});

// Admin: get all wishlists
const getAllWishlists = asyncHandler(async (req, res) => {
    const wishlists = await wishlistModel.getAllWishlists();
    return sendResponse(res, 200, 'All wishlists retrieved', wishlists);
});

module.exports = {
    addToWishlist,
    removeFromWishlist,
    getUserWishlist,
    getAllWishlists,
    isInTheWishlist,
};
