const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/:orderId', verifyToken, paymentController.getPaymentByOrder);

module.exports = router;
