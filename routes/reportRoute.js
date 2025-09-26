const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const reportController = require('../controllers/reportController');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/sales-summary', reportController.getSalesSummary);
router.get('/top-products', reportController.getTopProducts);
router.get('/sales-per-day', reportController.getSalesPerDay);
router.get('/user-report', reportController.getUserReport);
router.get('/weekly-sales', reportController.getWeeklySales);

// Used in Admin Order Page
router.get('/sales-summary-order', reportController.getSalesSummaryByStatus);

// Used in Admin Dashboard
router.get('/daily-sales', reportController.getDailySales);
router.get('/dashboard', reportController.getDashboardMetrics);

module.exports = router;
