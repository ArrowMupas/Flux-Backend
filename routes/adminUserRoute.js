const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const {
    validateUserCreation,
    validateRegister,
    validateStatus,
} = require('../validations/adminUserValidation');

router.get('/', adminUserController.getUsers);
router.get('/:id', adminUserController.getUserById);
router.put('/:id', validateUserCreation, adminUserController.updateUser);
router.patch('/manage/:id', validateStatus, adminUserController.manageUser);
router.post('/register', validateRegister, adminUserController.createUser);

module.exports = router;
