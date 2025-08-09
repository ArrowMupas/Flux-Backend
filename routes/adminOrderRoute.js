const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');
const verifyToken = require('../middlewares/authMiddleware');
const { validateStatusUpdate } = require('../validations/adminOrderValidation');
const { orderCompletionStockMiddleware } = require('../middlewares/autoStockCheckMiddleware');

router.get('/', adminOrderController.getAllOrders);
router.get('/:id', adminOrderController.getOrderById);
router.get('/user/:id', adminOrderController.getOrdersByUserId);
router.get('/status-history/:orderId', adminOrderController.getOrderStatusHistory);
router.patch(
    '/status-update/:orderId',
    verifyToken,
    validateStatusUpdate,
    adminOrderController.changeOrderStatus
);
router.patch('/cancel/:orderId', orderCompletionStockMiddleware(), adminOrderController.adminCancelOrder);
router.put('/requests/processing/:id', orderCompletionStockMiddleware(), adminOrderController.adminRefundReturnProcess);
router.put('/requests/completion/:id', orderCompletionStockMiddleware(), adminOrderController.adminRefundReturnComplete);

module.exports = router;
