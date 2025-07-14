const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const reviewModel = require('../models/reviewModel');
const HttpError = require('../helpers/errorHelper');

// Create a new review
const createReview = asyncHandler(async (req, res) => {
    const { user_id, order_id, reviews } = req.body;

    if (!user_id || !order_id || !Array.isArray(reviews) || reviews.length === 0) {
        throw new HttpError(400, 'user_id, order_id, and reviews array are required.');
    }

    // Validate each review object
    for (const review of reviews) {
        if (!review.product_id || !review.rating) {
            throw new HttpError(400, 'Each review must have product_id and rating.');
        }
    }

    // Add each review
    await Promise.all(
        reviews.map(({ product_id, rating, review_text }) =>
            reviewModel.addReview({ user_id, product_id, rating, review_text, order_id })
        )
    );

    return sendResponse(res, 201, 'Reviews created.');
});

// Get all reviews for a product
const getReviewsByProduct = asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    const reviews = await reviewModel.getReviewsByProduct(product_id);
    return sendResponse(res, 200, 'Product reviews retrieved.', reviews);
});

// Delete a review
const deleteReview = asyncHandler(async (req, res) => {
    const { review_id } = req.params;
    await reviewModel.deleteReview(review_id);
    return sendResponse(res, 200, 'Review deleted.');
});


// Get reviewed products for a user and order
const getReviewedProductsByOrderAndUser = asyncHandler(async (req, res) => {
    const { order_id, user_id } = req.params;
    if (!order_id || !user_id) {
        throw new HttpError(400, 'order_id and user_id are required.');
    }
    const products = await reviewModel.getReviewedProductsByOrderAndUser(order_id, user_id);
    return sendResponse(res, 200, 'Reviewed products retrieved.', products);
});

module.exports = {
    createReview,
    getReviewsByProduct,
    deleteReview,
    getReviewedProductsByOrderAndUser,
};
