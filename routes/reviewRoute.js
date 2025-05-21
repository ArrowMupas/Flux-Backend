const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.createReview);
router.get('/:product_id', reviewController.getReviewsByProduct);
router.delete('/:review_id', reviewController.deleteReview);

module.exports = router;
