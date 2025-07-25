const express = require('express');
const router = express.Router();
const adminActivityLogController = require('../controllers/adminActivityLogController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');

// All routes require authentication and admin/staff permissions
router.use(verifyToken);
router.use(authorizeAccess(['admin', 'staff']));

// GET /api/admin-activity-logs - Get all admin activity logs with filtering
router.get('/', adminActivityLogController.getAllAdminActivityLogs);

// GET /api/admin-activity-logs/summary - Get activity summary/statistics
router.get('/summary', adminActivityLogController.getActivitySummary);

// GET /api/admin-activity-logs/user/:userId - Get activity logs by user ID
router.get('/user/:userId', adminActivityLogController.getAdminActivityLogsByUserId);

// GET /api/admin-activity-logs/entity/:entityType/:entityId - Get activity logs by entity
router.get('/entity/:entityType/:entityId', adminActivityLogController.getAdminActivityLogsByEntity);

module.exports = router;
