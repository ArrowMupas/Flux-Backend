const asyncHandler = require('express-async-handler');
const orderService = require('../services/orderService');
const sendResponse = require('../middlewares/responseMiddleware');

// Create order
const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { payment_method, address, notes } = req.body;

    const result = await orderService.createOrder(userId, {
        payment_method,
        address,
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

    await orderService.cancelOrder(userId, orderId, notes);
    return sendResponse(res, 200, 'Order cancelled successfully');
});

module.exports = {
    createOrder,
    getOrders,
    getOrderStatusHistory,
    cancelOrder,
};
