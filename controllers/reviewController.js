const reviewModel = require('../models/reviewModel');
const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const HttpError = require('../helpers/errorHelper');

// Create a new review
const createReview = asyncHandler(async (req, res) => {
    const { user_id, product_id, rating, review_text } = req.body;
    if (!user_id || !product_id || !rating) {
        throw new HttpError(400, 'user_id, product_id, and rating are required.');
    }

    await reviewModel.addReview({ user_id, product_id, rating, review_text });
    return sendResponse(res, 201, 'Review created.');
});

// Get all reviews for a product
const getReviewsByProduct = asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    const reviews = await reviewModel.getReviewsByProduct(product_id);
    return sendResponse(res, 200, 'Product reviews fetched.', reviews);
});

// Delete a review
const deleteReview = asyncHandler(async (req, res) => {
    const { review_id } = req.params;
    await reviewModel.deleteReview(review_id);
    return sendResponse(res, 200, 'Review deleted.');
});

module.exports = {
    createReview,
    getReviewsByProduct,
    deleteReview,
};
