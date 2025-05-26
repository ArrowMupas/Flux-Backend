const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/accessMiddleware');
const reportController = require('../controllers/reportController');

router.get(
    '/sales-summary',
    verifyToken,
    authorize(['customer']),
    reportController.getSalesSummary
);
router.get('/top-products', verifyToken, authorize(['admin']), reportController.getTopProducts);
router.get(
    '/sales-per-day',
    verifyToken,
    authorize(['staff'], 'get_daily_sales'),
    reportController.getSalesPerDay
);
router.get(
    '/user-report',
    verifyToken,
    authorize(['admin', 'staff'], 'get_user_report'),
    reportController.getUserReport
);

module.exports = router;
