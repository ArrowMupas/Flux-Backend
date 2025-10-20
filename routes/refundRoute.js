const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const refundController = require('../controllers/refundController');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);
router.use(verifyToken);

router.get('/', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), refundController.getAllRefundRequests);
router.post('/request/:orderId', authorizeAccess([ROLES.CUSTOMER]), refundController.requestRefund);
router.patch('/approve/:orderId', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), refundController.adminApproveRefund);
router.patch('/deny/:orderId', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), refundController.adminDenyRefund);

module.exports = router;
