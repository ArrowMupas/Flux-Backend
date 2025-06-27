const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const paymentService = require('../services/paymentService');

// Get payment details by order ID
const getPaymentByOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId;

    const payment = await paymentService.getPaymentDetailsByOrder(orderId);

    return sendResponse(res, 200, 'Payment details retrieved.', payment);
});

module.exports = {
    getPaymentByOrder,
};
