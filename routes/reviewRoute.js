const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const reviewController = require('../controllers/reviewController');


router.post('/', verifyToken, reviewController.createReview);

router.get('/user/:user_id', reviewController.getReviewsByUser);
// Get reviewed products for a user and order
router.get('/order/:order_id/user/:user_id', reviewController.getReviewedProductsByOrderAndUser);
router.put('/:review_id', verifyToken, reviewController.updateReview);
router.delete('/:review_id', verifyToken, reviewController.deleteReview);

router.get('/:product_id', reviewController.getReviewsByProduct);
module.exports = router;
