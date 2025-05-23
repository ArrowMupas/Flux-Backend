const asyncHandler = require('express-async-handler');
const orderService = require('../services/orderService');
const sendResponse = require('../middlewares/responseMiddleware');

// Create order
const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { notes } = req.body;

    const result = await orderService.createOrder(userId, {
        notes,
    });
    return sendResponse(res, 200, 'Order Created', result);
});

// Get order by status
const getOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const status = req.params.status || req.query.status;
    const data = await orderService.getOrders(userId, status);
    return sendResponse(res, 200, 'Orders fetched', data);
});

// Get order status history
const getOrderStatusHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.orderId;

    const history = await orderService.getOrderStatusHistory(userId, orderId);
    return sendResponse(res, 200, 'Order status history fetched', history);
});

// Cancel Order
const cancelOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.orderId;
    const { notes } = req.body;

    const message = await orderService.cancelOrder(userId, orderId, notes);
    return sendResponse(res, 200, message);
});

module.exports = {
    createOrder,
    getOrders,
    getOrderStatusHistory,
    cancelOrder,
};
