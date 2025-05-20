const asyncHandler = require('express-async-handler');
const paymentService = require('../services/paymentService');
const sendResponse = require('../middlewares/responseMiddleware');

const submitPayment = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { order_id, method, reference_number, account_name, address } = req.body;

    const paymentId = await paymentService.submitPayment(
        userId,
        order_id,
        method,
        reference_number,
        account_name,
        address
    );
    return sendResponse(res, 201, 'Payment submitted', { payment_id: paymentId });
});

const getPaymentByOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId;

    const payment = await paymentService.getPaymentDetailsByOrder(orderId);

    return sendResponse(res, 200, 'Payment details fetched.', payment);
});

module.exports = {
    submitPayment,
    getPaymentByOrder,
};
