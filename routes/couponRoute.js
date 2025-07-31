const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const ROLES = require('../constants/roles');
const validate = require('../middlewares/validateMiddleware');
const { couponSchema } = require('../validations/couponValidation');

router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.post('/', validate(couponSchema), couponController.createCoupon);

module.exports = router;
