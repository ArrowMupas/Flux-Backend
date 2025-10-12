const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const { statusUpdateSchema } = require('../validations/adminOrderValidation');
const validate = require('../middlewares/validateMiddleware');
const ROLES = require('../constants/roles');
const adminLogMiddleware = require('../middlewares/adminLogMiddleware');
const { ACTION_TYPES, ENTITY_TYPES } = require('../constants/adminActivityTypes');
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
router.patch(
    '/move-to-processing/:orderId',
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.ORDER,
        action_type: ACTION_TYPES.PROCESS,
    }),
    adminOrderController.movePendingToProcessing
);
router.patch(
    '/move-to-shipping/:orderId',
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.ORDER,
        action_type: ACTION_TYPES.SHIP,
    }),
    adminOrderController.moveProcessingToShipping
);
router.patch(
    '/move-to-delivered/:orderId',
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.ORDER,
        action_type: ACTION_TYPES.DELIVER,
    }),
    adminOrderController.moveShippingToDelivered
);
router.patch(
    '/cancel/:orderId',
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.ORDER,
        action_type: ACTION_TYPES.CANCEL,
    }),
    adminOrderController.adminCancelOrder
);

module.exports = router;
