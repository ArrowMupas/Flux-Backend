const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/accessMiddleware');
const permissionController = require('../controllers/permissionController');

router.put('/control/:id', permissionController.updateStaffPermissions);
router.get('/', permissionController.getPermissionsList);
router.get('/staff/', permissionController.getStaffUsers);
router.get('/staff/:id', permissionController.getStaffUserPermissions);

module.exports = router;
