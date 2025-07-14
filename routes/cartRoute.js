const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { validateCartItem } = require('../validations/cartValidation');

router.get('/:id', cartController.getCartItems);
router.post('/:id', validateCartItem, cartController.addToCart);
router.put('/:id', validateCartItem, cartController.updateCartItemQuantity);
router.delete('/:id', cartController.removeCartItem);
router.delete('/clear/:id', cartController.clearCart);
router.post('/user/:userId/apply-coupon', cartController.applyCouponToUserCart);

module.exports = router;
