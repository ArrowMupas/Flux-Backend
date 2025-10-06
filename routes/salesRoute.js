const express = require('express');
const router = express.Router();
const { getDailySales, getWeeklySales, getMonthlySales, getYearlySales, generateOrdersPDFReport } = require('../controllers/salesController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');

router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/daily', getDailySales);
router.get('/weekly', getWeeklySales);
router.get('/monthly', getMonthlySales);
router.get('/yearly', getYearlySales);
router.get('/pdf-report', generateOrdersPDFReport);

module.exports = router;