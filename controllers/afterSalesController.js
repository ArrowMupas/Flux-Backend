const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const orderModel = require('../models/orderModel');
const afterSalesModel = require('../models/afterSalesModel');
const HttpError = require('../helpers/errorHelper');

const submitRefundRequest = asyncHandler(async (req, res) => {
    const { order_id, reason } = req.body;
    const user_id = req.user.id;

    const order = await orderModel.getOrderById(order_id);
    if (!order) throw new HttpError(404, 'Order not found');

    const result = await afterSalesModel.createRequest('refund', order_id, user_id, reason);
    return sendResponse(res, 200, 'Refund request submitted', result);
});

const submitReturnRequest = asyncHandler(async (req, res) => {
    const { order_id, reason } = req.body;
    const user_id = req.user.id;

    const order = await orderModel.getOrderById(order_id);
    if (!order) throw new HttpError(404, 'Order not found');

    console.log(order);

    const result = await afterSalesModel.createRequest('return', order_id, user_id, reason);
    return sendResponse(res, 200, 'Return request submitted', result);
});

const getUserRequests = asyncHandler(async (req, res) => {
    const user_id = req.user.id;

    const result = await afterSalesModel.getUserRequests(user_id);
    return sendResponse(res, 200, 'Return request submitted', result);
});

module.exports = {
    submitRefundRequest,
    submitReturnRequest,
    getUserRequests,
};
