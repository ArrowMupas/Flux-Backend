const express = require('express');
const router = express.Router();
const {
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getYearlySales,
    generateOrdersPDFReport,
} = require('../controllers/salesController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');

router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/daily', getDailySales);
router.get('/weekly', getWeeklySales);
router.get('/monthly', getMonthlySales);
router.get('/yearly', getYearlySales);
router.get(
    '/pdf-report',
    (req, res, next) => {
        res.set('Content-Encoding', 'identity');
        res.set('Cache-Control', 'no-transform, no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.removeHeader('ETag');
        res.removeHeader('Last-Modified');

        next();
    },
    generateOrdersPDFReport
);

module.exports = router;
