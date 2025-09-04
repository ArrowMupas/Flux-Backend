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
const adminLogMiddleware = require('../middlewares/adminLogMiddleware');
const { ACTION_TYPES, ENTITY_TYPES } = require('../constants/adminActivityTypes');
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
router.put(
    '/:id',
    validateUserCreation,
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.USER,
        action_type: ACTION_TYPES.UPDATE,
    }),
    adminUserController.updateUser
);

// PATCH user status (togglr)
router.patch(
    '/manage/:id',
    validateStatus,
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.USER,
        action_type: (req) =>
            req.body.is_active ? ACTION_TYPES.ACTIVATE_USER : ACTION_TYPES.DEACTIVATE_USER,
    }),
    adminUserController.manageUser
);

// REGISTER new user
router.post(
    '/register',
    validateRegister,
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.USER,
        action_type: ACTION_TYPES.CREATE,
    }),
    adminUserController.createUser
);

module.exports = router;
