const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const { generalLimiter, loginLimiter } = require('../middlewares/rateLimiterMiddleware');
const {
    validateRegistration,
    validateLogin,
    validatePasswordReset,
    validateUserUpdate,
    validateEmail,
} = require('../validations/userValidation');
const {
    loginUser,
    registerUser,
    verifyEmail,
    logoutUser,
    resendVerificationEmail,
    getUserProfile,
    updateUser,
    updateUserPassword,
} = require('../controllers/userController');

// Public routes
router.post('/login', loginLimiter, validateLogin, loginUser);
router.use(generalLimiter);

router.post('/register', validateRegistration, registerUser);
router.get('/verify-email', verifyEmail);
router.post('/logout', logoutUser);
router.post('/resend-verification-email', validateEmail, resendVerificationEmail);

// Protected routes
router.use(verifyToken);

router.get('/', getUserProfile);
router.put('/', validateUserUpdate, updateUser);
router.post('/reset', validatePasswordReset, updateUserPassword);

module.exports = router;
