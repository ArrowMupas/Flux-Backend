const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const notificationController = require('../controllers/notificationController');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);
router.use(verifyToken);

// 👇 Customers can view their own notifications
router.get('/', authorizeAccess([ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]), notificationController.getNotifications);

// 👇 Mark a notification as read
router.patch(
    '/:id/read',
    authorizeAccess([ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]),
    notificationController.markAsRead
);

module.exports = router;
