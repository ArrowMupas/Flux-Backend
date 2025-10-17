const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authAccess = require('../middlewares/accessMiddleware');
const wishlistController = require('../controllers/wishlistController');

// User routes
router.post('/', verifyToken, wishlistController.addToWishlist);
router.get('/', verifyToken, wishlistController.getUserWishlist);
router.get('/check/:product_id', verifyToken, wishlistController.isInTheWishlist)
router.delete('/:product_id', verifyToken, wishlistController.removeFromWishlist);

//Admin routes
router.get('/admin/all', verifyToken, authAccess(['admin']), wishlistController.getAllWishlists);

module.exports = router;