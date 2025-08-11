const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const reportController = require('../controllers/reportController');

router.get('/sales-summary', reportController.getSalesSummary);
router.get(
    '/sales-summary-order',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    reportController.getSalesSummaryByStatus
);
router.get('/top-products', reportController.getTopProducts);
router.get('/sales-per-day', reportController.getSalesPerDay);
router.get('/user-report', reportController.getUserReport);

module.exports = router;
