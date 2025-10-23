const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const loyaltyController = require('../controllers/loyaltyController');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);
router.use(verifyToken);

router.post('/create', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), loyaltyController.createLoyaltyReward);
router.get('/me', authorizeAccess([ROLES.CUSTOMER]), loyaltyController.FetchLoyaltyProgress);
router.post('/claim/:rewardId', authorizeAccess([ROLES.CUSTOMER]), loyaltyController.ClaimLoyaltyReward);
router.get('/claimed', authorizeAccess([ROLES.CUSTOMER]), loyaltyController.FetchUserRewards);

module.exports = router;
