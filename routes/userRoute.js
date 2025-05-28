const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');
const regexMiddleware = require('../middlewares/regexMiddleware');

router.post(
    '/register',
    regexMiddleware.regexValidation(['username', 'email', 'password']),
    userController.registerUser
);
router.post('/login', userController.loginUser);
router.post(
    '/reset',
    regexMiddleware.regexValidation(['username', 'newPassword']),
    userController.resetUserPassword
);
// Protected routes
router.get('/', verifyToken, userController.getUserProfile);
router.put(
    '/',
    verifyToken,
    regexMiddleware.regexValidation(['username']),
    userController.updateUser
);
router.get('/verify-email', userController.verifyEmail);
router.post('/resend-verification-email', userController.resendVerificationEmail);
router.post('/request-password-reset', userController.requestPasswordReset);
router.get('/verify-password-reset', userController.verifyResetToken);
router.post('/change-password', userController.changeUserPassword);

module.exports = router;
