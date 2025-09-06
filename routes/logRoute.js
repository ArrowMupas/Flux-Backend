const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { getSignins, getAdminAuditLogs } = require('../controllers/logController');
const cacheRoute = require('../middlewares/cacheMiddleware');

router.get(
    '/signins',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    cacheRoute('1 minute'),
    getSignins
);

router.get(
    '/admin-audit-logs',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    cacheRoute('1 minute'),
    getAdminAuditLogs
);

module.exports = router;
