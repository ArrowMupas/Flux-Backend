const express = require('express');
const router = express.Router();
const { getWeeklySales, getMonthlySales } = require('../controllers/salesController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');

router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/weekly', getWeeklySales);
router.get('/monthly', getMonthlySales);

module.exports = router;