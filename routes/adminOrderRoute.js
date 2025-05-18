const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');
const verifyToken = require('../middlewares/authMiddleware');
const { validateStatusUpdate } = require('../validations/adminOrderValidation');

router.get('/', adminOrderController.getAllOrders);
router.get('/:id', adminOrderController.getOrderById);
router.get('/user/:id', adminOrderController.getOrdersByUserId);
router.get('/status-history/:orderId', adminOrderController.getOrderStatusHistory);
router.patch(
    '/status-update/:orderId',
    validateStatusUpdate,
    adminOrderController.changeOrderStatus
);

module.exports = router;
