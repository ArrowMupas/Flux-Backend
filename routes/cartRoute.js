const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { cartSchema } = require('../validations/cartValidation');
const validate = require('../middlewares/validateMiddleware');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.CUSTOMER]));

router.get('/me', cartController.getCartItems);
router.post('/me', validate(cartSchema), cartController.addToCart);
router.put('/me', validate(cartSchema), cartController.updateCartItemQuantity);
router.delete('/me', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);
router.post('/apply-coupon', cartController.applyCouponToCart);
router.delete('/coupon', cartController.removeCoupon);

module.exports = router; //
