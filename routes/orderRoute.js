const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/authMiddleware'); // Add auth middleware

router.get('/:id', verifyToken, orderController.getOrderDetails);
router.post('/', verifyToken, orderController.checkoutFromCart);
router.post('/:id/items', verifyToken, orderController.addOrderItem);
router.put('/:id/status', verifyToken, orderController.updateOrderStatus);

module.exports = router;