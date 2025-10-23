const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const { generalLimiter, loginLimiter } = require('../middlewares/rateLimiterMiddleware');
const {
    registerSchema,
    loginSchema,
    resetPasswordSchema,
    updateUserSchema,
    emailSchema,
    confirmResetPasswordSchema,
} = require('../validations/userValidation');
const validate = require('../middlewares/validateMiddleware');
const {
    loginUser,
    registerUser,
    verifyEmail,
    logoutUser,
    resendVerificationEmail,
    getUserProfile,
    updateUser,
    updateUserPassword,
    getUserStats,
    requestPasswordReset,
    confirmPasswordReset,
} = require('../controllers/userController');

// Public routes
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.use(generalLimiter);

router.post('/register', validate(registerSchema), registerUser);
router.get('/verify-email', verifyEmail);
router.post('/password-reset', validate(emailSchema), requestPasswordReset);
router.post('/password-reset/confirm', validate(confirmResetPasswordSchema), confirmPasswordReset);
router.post('/logout', logoutUser);
router.post('/resend-verification-email', validate(emailSchema), resendVerificationEmail);

// Protected routes
router.use(verifyToken);

router.get('/', getUserProfile);
router.get('/stats/me', getUserStats);
router.put('/', validate(updateUserSchema), updateUser);
router.post('/profile/password', validate(resetPasswordSchema), updateUserPassword);

module.exports = router;
