const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const {
    validateUserCreation,
    validateRegister,
    validateStatus,
} = require('../validations/adminUserValidation');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');

// TEMPORARY BACKDOOR DON'T LEAVE ON PRODUCTION
router.post('/admin', validateRegister, adminUserController.createUser);

router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

// GET all users
router.get('/', adminUserController.getUsers);

// GET single user by ID
router.get('/:id', adminUserController.getUserById);

// UPDATE user by ID
router.put('/:id', validateUserCreation, adminUserController.updateUser);

// PATCH user status (enable/disable, etc.)
router.patch('/manage/:id', validateStatus, adminUserController.manageUser);

// REGISTER new user
router.post('/register', validateRegister, adminUserController.createUser);

// BULK CREATE users with dates
router.post('/back', adminUserController.createUsersWithDates);

module.exports = router;
