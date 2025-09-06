const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const { statusUpdateSchema } = require('../validations/adminOrderValidation');
const validate = require('../middlewares/validateMiddleware');
const ROLES = require('../constants/roles');
const { orderCompletionStockMiddleware } = require('../middlewares/autoStockCheckMiddleware');
const adminOrderController = require('../controllers/adminOrderController');
const {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    getOrderStatusHistory,
} = require('../controllers/adminOrderController');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.get('/user/:id', getOrdersByUserId);
router.get('/status-history/:orderId', getOrderStatusHistory);
router.patch('/status-update/:orderId', validate(statusUpdateSchema), adminOrderController.changeOrderStatus);
router.patch('/cancel/:orderId', orderCompletionStockMiddleware(), adminOrderController.adminCancelOrder);

module.exports = router;
