const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/authMiddleware');
const { validatePayment } = require('../validations/paymentValidation');

router.post('/', validatePayment, verifyToken, paymentController.submitPayment);
router.get('/:orderId', verifyToken, paymentController.getPaymentByOrder);

module.exports = router;
