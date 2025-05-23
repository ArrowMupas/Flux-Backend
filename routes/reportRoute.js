const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const reportController = require('../controllers/reportController');

router.get('/sales-summary', reportController.getSalesSummary);
router.get('/top-products', reportController.getTopProducts);
router.get('/sales-per-day', reportController.getSalesPerDay);

module.exports = router;
