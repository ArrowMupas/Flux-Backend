const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/accessMiddleware');
const reportController = require('../controllers/reportController');

router.get('/sales-summary', reportController.getSalesSummary);
router.get('/sales-summary-order', reportController.getSalesSummaryByStatus);
router.get('/top-products', reportController.getTopProducts);
router.get('/sales-per-day', reportController.getSalesPerDay);
router.get('/user-report', reportController.getUserReport);

module.exports = router;
