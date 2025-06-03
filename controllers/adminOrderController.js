const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const adminOrderService = require('../services/adminOrderService');

// Admin get all orders
const getAllOrders = asyncHandler(async (req, res) => {
    const status = req.params.status || req.query.status;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    const data = await adminOrderService.getAllOrders(status, startDate, endDate);
    return sendResponse(res, 200, 'All orders retrieved', data);
});

// Admin order by ID
const getOrderById = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const order = await adminOrderService.getOrderById(orderId);

    return sendResponse(res, 200, 'Order retrieved successfully', order);
});

// Admin get order by user ID
const getOrdersByUserId = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const orders = await adminOrderService.getOrdersByUserId(userId);

    return sendResponse(res, 200, 'Orders retrieved successfully', orders);
});

// Admin get order status history
const getOrderStatusHistory = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId;

    const history = await adminOrderService.getOrderStatusHistory(orderId);
    return sendResponse(res, 200, 'Order status history retrieved', history);
});

// Admin change status of order
const changeOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await adminOrderService.changeOrderStatus(orderId, status, notes);
    return sendResponse(res, 200, 'Order status updated', order);
});

const adminCancelOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId;
    const { notes } = req.body;

    await adminOrderService.adminCancelOrder(orderId, notes);
    return sendResponse(res, 200, 'Order cancelled by admin');
});

const adminRefundReturnProcess = asyncHandler(async (req, res) => {
    const requestId = req.params.id;

    await adminOrderService.markRefundReturnPending(requestId);
    return sendResponse(res, 200, 'Order processed');
});

const adminRefundReturnComplete = asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const { notes } = req.body;

    await adminOrderService.markRefundReturnCompleted(requestId, notes);
    return sendResponse(res, 200, 'Order completed');
});

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    getOrderStatusHistory,
    changeOrderStatus,
    adminCancelOrder,
    adminRefundReturnProcess,
    adminRefundReturnComplete,
};
