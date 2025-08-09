const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateCheckout } = require('../validations/orderValidation');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { orderCompletionStockMiddleware } = require('../middlewares/autoStockCheckMiddleware');

router.use(verifyToken);
router.use(authorizeAccess([ROLES.CUSTOMER]));

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.get('/status-history/:orderId', orderController.getOrderStatusHistory);
router.post('/', validateCheckout, orderController.createOrder);
router.put('/cancel/:orderId', orderCompletionStockMiddleware(), orderController.cancelOrder);

module.exports = router;
