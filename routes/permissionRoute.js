const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const permissionController = require('../controllers/permissionController');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN]));

router.put('/control/:id', permissionController.updateStaffPermissions);
router.get('/', permissionController.getPermissionsList);
router.get('/staff/', permissionController.getStaffUsers);
router.get('/staff/:id', permissionController.getStaffUserPermissions);

module.exports = router;
