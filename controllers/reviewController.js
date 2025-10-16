const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const reviewModel = require('../models/reviewModel');
const HttpError = require('../helpers/errorHelper');

const createReview = asyncHandler(async (req, res) => {
    const { user_id, product_id, rating, review_text } = req.body;

    if (!user_id || !product_id || !rating) {
        throw new HttpError(400, 'user_id, product_id, and rating are required.');
    }

    if (rating < 1 || rating > 5) {
        throw new HttpError(400, 'Rating must be between 1 and 5.');
    }

    const hasPurchased = await reviewModel.hasUserPurchasedProduct(user_id, product_id);
    if (!hasPurchased) {
        throw new HttpError(403, 'You can only review products you have purchased and received.');
    }

    const hasReviewed = await reviewModel.hasUserReviewedProduct(user_id, product_id);
    if (hasReviewed) {
        throw new HttpError(409, 'You have already reviewed this product.');
    }

    await reviewModel.addReview({
        user_id,
        product_id,
        rating,
        review_text: review_text || null,
        order_id: null,
    });

    return sendResponse(res, 201, 'Review created successfully.');
});

// Get all reviews for a product
const getReviewsByProduct = asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    const reviews = await reviewModel.getReviewsByProduct(product_id);
    return sendResponse(res, 200, 'Product reviews retrieved.', reviews);
});

const deleteReview = asyncHandler(async (req, res) => {
    const { review_id } = req.params;
    await reviewModel.deleteReview(review_id);
    return sendResponse(res, 200, 'Review deleted.');
});

const getReviewedProductsByOrderAndUser = asyncHandler(async (req, res) => {
    const { order_id, user_id } = req.params;
    if (!order_id || !user_id) {
        throw new HttpError(400, 'order_id and user_id are required.');
    }
    const products = await reviewModel.getReviewedProductsByOrderAndUser(order_id, user_id);
    return sendResponse(res, 200, 'Reviewed products retrieved.', products);
});

const getReviewsByUser = asyncHandler(async (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
        throw new HttpError(400, 'User ID is required!!');
    }

    const reviews = await reviewModel.getReviewsByUser(user_id);
    return sendResponse(res, 200, 'User Reviews retrieved successfully!', reviews);
});

const updateReview = asyncHandler(async (req, res) => {
    const { review_id } = req.params;
    const { rating, review_text } = req.body;

    if (!review_id) {
        throw new HttpError(400, 'Review ID is required!!');
    }

    // Edge case thingy + testing stuff
    if (rating && (rating < 1 || rating > 5)) {
        throw new HttpError(400, 'Rating must be between 1 and 5');
    }

    const updated = await reviewModel.updateReview(review_id, rating, review_text);

    if (!updated) {
        throw new HttpError(404, 'Review not found.');
    }

    return sendResponse(res, 200, 'Review Updated Successfully!', updated);
});

module.exports = {
    createReview,
    getReviewsByProduct,
    deleteReview,
    getReviewedProductsByOrderAndUser,
    getReviewsByUser,
    updateReview,
};
