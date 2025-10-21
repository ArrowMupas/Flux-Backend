const express = require('express');
const router = express.Router();
const { checkoutSchema } = require('../validations/orderValidation');
const validate = require('../middlewares/validateMiddleware');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { generalLimiter, orderLimiter } = require('../middlewares/rateLimiterMiddleware');
const orderController = require('../controllers/orderController');
const { getOrders, getOrderById, getOrderStatusHistory } = require('../controllers/orderController');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.CUSTOMER]));

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/status-history/:orderId', getOrderStatusHistory);
router.post('/', orderLimiter, validate(checkoutSchema), orderController.createOrder);
router.put('/cancel/:orderId', orderController.cancelOrder);

module.exports = router;
