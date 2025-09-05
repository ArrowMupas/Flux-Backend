const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');
const {
    validateRegistration,
    validateLogin,
    validatePasswordReset,
    validateUserUpdate,
    validateEmail,
    validateConfirmPasswordReset,
} = require('../validations/userValidation');

router.post('/register', validateRegistration, userController.registerUser);
router.post('/login', validateLogin, userController.loginUser);
router.post('/resend-verification-email', validateEmail, userController.resendVerificationEmail);
router.post('/logout', userController.logoutUser);

// Protected routes
router.get('/', verifyToken, userController.getUserProfile);
router.put('/', verifyToken, validateUserUpdate, userController.updateUser);
router.post('/reset', verifyToken, validatePasswordReset, userController.updateUserPassword);
router.get('/verify-email', userController.verifyEmail);

module.exports = router;
