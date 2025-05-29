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
router.post('/reset', validatePasswordReset, userController.resetUserPassword);
router.post('/resend-verification-email', validateEmail, userController.resendVerificationEmail);
router.post('/request-password-reset', validateEmail, userController.requestPasswordReset);
// Protected routes
router.get('/', verifyToken, userController.getUserProfile);
router.put('/', verifyToken, validateUserUpdate, userController.updateUser);
router.get('/verify-email', userController.verifyEmail);
router.get('/verify-password-reset', userController.verifyResetToken);
router.post('/change-password', validateConfirmPasswordReset, userController.changeUserPassword);

module.exports = router;
