const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', verifyToken, orderController.getOrders);
router.get('/status-history/:orderId', verifyToken, orderController.getOrderStatusHistory);
router.post('/', verifyToken, orderController.createOrder);
router.put('/cancel/:orderId', verifyToken, orderController.cancelOrder);

module.exports = router;
