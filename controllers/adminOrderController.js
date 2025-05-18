const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const adminOrderService = require('../services/adminOrderService');

// Admin get all orders
const getAllOrders = asyncHandler(async (req, res) => {
    const status = req.params.status || req.query.status;
    const data = await adminOrderService.getAllOrders(status);
    return sendResponse(res, 200, 'All orders fetched', data);
});

// Admin order by ID
const getOrderById = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const order = await adminOrderService.getOrderById(orderId);

    return sendResponse(res, 200, 'Order fetched successfully', order);
});

// Admin get order by user ID
const getOrdersByUserId = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const orders = await adminOrderService.getOrdersByUserId(userId);

    return sendResponse(res, 200, 'Orders fetched successfully', orders);
});

// Admin get order status history
const getOrderStatusHistory = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId;

    const history = await adminOrderService.getOrderStatusHistory(orderId);
    return sendResponse(res, 200, 'Order status history fetched', history);
});

// Admin change status of order
const changeOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await adminOrderService.changeOrderStatus(orderId, status, notes);
    return sendResponse(res, 200, 'Order status updated', order);
});

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    getOrderStatusHistory,
    changeOrderStatus,
};
