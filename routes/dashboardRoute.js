const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');

router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/metrics', dashboardController.getDashboardMetrics);

module.exports = router;