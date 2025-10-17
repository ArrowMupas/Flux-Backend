const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const returnController = require('../controllers/returnController');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);
router.use(verifyToken);

router.get('/', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), returnController.getAllReturnRequests);
router.post('/request/:orderId', authorizeAccess([ROLES.CUSTOMER]), returnController.requestReturn);

module.exports = router;
