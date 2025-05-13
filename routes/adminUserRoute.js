const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const regexMiddleware = require('../middlewares/regexMiddleware');

router.get('/', adminUserController.getAllUsers);
router.get('/:id', adminUserController.getUserById);
router.put(
    '/:id',
    regexMiddleware.regexValidation(['username', 'email']),
    adminUserController.updateUser
);
router.patch('/manage/:id', adminUserController.manageUser);
router.post(
    '/register',
    regexMiddleware.regexValidation(['username', 'email', 'password']),
    adminUserController.createUser
);

module.exports = router;
