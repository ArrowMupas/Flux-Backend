const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const afterSalesController = require('../controllers/afterSalesController');

router.post('/refund', verifyToken, afterSalesController.submitRefundRequest);
router.post('/return', verifyToken, afterSalesController.submitReturnRequest);
router.get('/', verifyToken, afterSalesController.getUserRequests);

module.exports = router;
