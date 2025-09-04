const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { getSignins, getAdminAuditLogs } = require('../controllers/logController');

router.get('/signins', verifyToken, authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), getSignins);

router.get(
    '/admin-audit-logs',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    getAdminAuditLogs
);

module.exports = router;
