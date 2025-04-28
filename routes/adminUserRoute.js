const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');

router.get('/', adminUserController.getAllUsers);
router.get('/:id', adminUserController.getUserById);
router.put('/:id', adminUserController.updateUser);
router.patch('/manage/:id', adminUserController.manageUser);

module.exports = router;
