const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const reviewController = require('../controllers/reviewController');


router.post('/', reviewController.createReview);
router.get('/:product_id', reviewController.getReviewsByProduct);
router.delete('/:review_id', reviewController.deleteReview);

// Get reviewed products for a user and order
router.get('/order/:order_id/user/:user_id', reviewController.getReviewedProductsByOrderAndUser);

module.exports = router;
