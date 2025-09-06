const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const adminLogMiddleware = require('../middlewares/adminLogMiddleware');
const { ACTION_TYPES, ENTITY_TYPES } = require('../constants/adminActivityTypes');
const ROLES = require('../constants/roles');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const { statusSchema, registerSchema, userSchema } = require('../validations/adminUserValidation');
const adminUserController = require('../controllers/adminUserController');
const { getUsers, getUserById, updateUser, manageUser, createUser } = require('../controllers/adminUserController');
const validate = require('../middlewares/validateMiddleware');

router.post('/admin', validate(registerSchema), adminUserController.createUser);

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/', getUsers);
router.get('/:id', getUserById);

router.put(
    '/:id',
    validate(userSchema),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.USER,
        action_type: ACTION_TYPES.UPDATE,
    }),
    updateUser
);

router.patch(
    '/manage/:id',
    validate(statusSchema),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.USER,
        action_type: (req) => (req.body.is_active ? ACTION_TYPES.ACTIVATE_USER : ACTION_TYPES.DEACTIVATE_USER),
    }),
    manageUser
);

router.post(
    '/register',
    validate(registerSchema),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.USER,
        action_type: ACTION_TYPES.CREATE,
    }),
    createUser
);

module.exports = router;
