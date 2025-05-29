const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const afterSalesController = require('../controllers/afterSalesController');
const { validateRequest } = require('../validations/afterSalesValidation');

router.post('/refund', validateRequest, verifyToken, afterSalesController.submitRefundRequest);
router.post('/return', validateRequest, verifyToken, afterSalesController.submitReturnRequest);
router.get('/', verifyToken, afterSalesController.getUserRequests);

module.exports = router;
