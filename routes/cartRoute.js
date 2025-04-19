const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/:id', cartController.getCartItems);
router.post('/:id', cartController.addToCart);
router.put('/:id', cartController.updateCartItemQuantity);
router.delete('/:id', cartController.removeCartItem);
router.delete('/clear/:id', cartController.clearCart);

// will be implemented with JWT in the future

module.exports = router;
