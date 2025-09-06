const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const cacheRoute = require('../middlewares/cacheMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const { getSignins, getAdminAuditLogs } = require('../controllers/logController');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/signins', cacheRoute('1 minute'), getSignins);
router.get('/admin-audit-logs', cacheRoute('30 seconds'), getAdminAuditLogs);

module.exports = router;
