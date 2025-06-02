const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Admin
router.post('/', notificationController.createNotification);

// User
router.get('/:userId', notificationController.getUserNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/mark-all/:userId', notificationController.markAllAsRead);

module.exports = router;
