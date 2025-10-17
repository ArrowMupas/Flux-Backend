const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authAccess = require('../middlewares/accessMiddleware');
const reviewController = require('../controllers/reviewController');

// User Routes
router.post('/', verifyToken, reviewController.createReview);
router.get('/user/:user_id', reviewController.getReviewsByUser);
router.get('/order/:order_id/user/:user_id', reviewController.getReviewedProductsByOrderAndUser);
router.put('/:review_id', verifyToken, reviewController.updateReview);
router.delete('/:review_id', verifyToken, reviewController.deleteReview);
router.get('/:product_id', reviewController.getReviewsByProduct);

//Admin Routes
router.get('/admin/all', verifyToken, authAccess(['admin']), reviewController.getAllReviews);
router.get('/admin/flagged', verifyToken, authAccess(['admin']), reviewController.getFlaggedReviews);
router.post('/admin/flag/:review_id', verifyToken, authAccess(['admin']), reviewController.flagReviewByAdmin);
router.post('/admin/moderate/:review_id', verifyToken, authAccess(['admin']), reviewController.moderateReview);
router.delete('/admin/:review_id', verifyToken, authAccess(['admin']), reviewController.adminDeleteReview);

module.exports = router;
