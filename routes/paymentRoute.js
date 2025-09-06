const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.CUSTOMER]));

router.get('/:orderId', verifyToken, paymentController.getPaymentByOrder);

module.exports = router;
