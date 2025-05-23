const paymentModel = require('../models/paymentModel');
const orderModel = require('../models/orderModel');
const HttpError = require('../helpers/errorHelper');

const submitPayment = async (userId, order_id, method, reference_number, account_name, address) => {
    const order = await orderModel.getOrderById(order_id);
    if (!order) throw new HttpError(400, 'Order not found');
    if (order.customer_id !== userId) throw new HttpError(403, 'Not Authorized');

    const existingPayment = await paymentModel.getPaymentByOrderId(order_id);
    if (existingPayment) {
        throw new HttpError(400, 'Payment for this order already submitted');
    }

    let paymentId = '';
    if (order.status === 'pending') {
        paymentId = await paymentModel.createPayment(
            order_id,
            method,
            reference_number,
            account_name,
            address
        );
    } else {
        throw new HttpError(400, 'Cannot pay for this order');
    }

    return paymentId;
};

const getPaymentDetailsByOrder = async (orderId) => {
    const payment = await paymentModel.getPaymentByOrderId(orderId);
    if (!payment) {
        throw new HttpError(404, 'Payment for this order not submitted yet');
    }
    return payment;
};

module.exports = {
    submitPayment,
    getPaymentDetailsByOrder,
};
