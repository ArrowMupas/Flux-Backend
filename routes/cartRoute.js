const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { validateCartItem } = require('../validations/cartValidation');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');

router.use(verifyToken);
router.use(authorizeAccess([ROLES.CUSTOMER]));

router.get('/me', cartController.getCartItems);
router.post('/me', validateCartItem, cartController.addToCart);
router.put('/me', validateCartItem, cartController.updateCartItemQuantity);
router.delete('/me', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);
router.post('/apply-coupon', cartController.applyCouponToCart);
router.delete('/coupon', cartController.removeCoupon);

module.exports = router;
