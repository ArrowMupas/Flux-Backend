const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const { WalkInOderSchema } = require('../validations/walkInOrderValidation');
const walkInOrderController = require('../controllers/walkInOrderController');
const validate = require('../middlewares/validateMiddleware');

router.use(generalLimiter);
router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.post('/', validate(WalkInOderSchema), walkInOrderController.createWalkInSale);
router.get('/', walkInOrderController.getAllWalkInOrders);

module.exports = router;
