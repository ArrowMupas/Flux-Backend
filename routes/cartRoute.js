const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/:id', cartController.getCartItems);
router.post('/:id', cartController.addToCart);
router.put('/:id', cartController.updateCartItemQuantity);
router.delete('/:id', cartController.removeCartItem);
router.delete('/clear/:id', cartController.clearCart);

module.exports = router;
