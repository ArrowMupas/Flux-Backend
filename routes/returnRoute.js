const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const returnController = require('../controllers/returnController');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { returnRequestSchema } = require('../validations/returnValidation');

router.use(generalLimiter);
router.use(verifyToken);

router.get('/', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), returnController.getAllReturnRequests);
router.post(
    '/request/:orderId',
    validate(returnRequestSchema),
    authorizeAccess([ROLES.CUSTOMER]),
    returnController.requestReturn
);
router.patch('/approve/:orderId', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), returnController.adminApproveReturn);
router.patch('/deny/:orderId', authorizeAccess([ROLES.ADMIN, ROLES.STAFF]), returnController.adminDenyReturn);

module.exports = router;
