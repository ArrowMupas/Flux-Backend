const paymentModel = require('../models/paymentModel');
const HttpError = require('../helpers/errorHelper');

const getPaymentDetailsByOrder = async (orderId) => {
    const payment = await paymentModel.getPaymentByOrderId(orderId);
    if (!payment) {
        throw new HttpError(404, 'Payment for this order not submitted yet');
    }
    return payment;
};

module.exports = {
    getPaymentDetailsByOrder,
};
