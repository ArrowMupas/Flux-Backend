const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const adminOrderService = require('../services/adminOrderService');
const HttpError = require('../helpers/errorHelper');

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
    const { orderId } = req.params;

    const history = await adminOrderService.getOrderStatusHistory(orderId);
    return sendResponse(res, 200, 'Order status history retrieved', history);
});

// Admin cancel order
const adminCancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { notes } = req.body;
    const { id } = req.user;

    await adminOrderService.adminCancelOrder(orderId, notes, id);
    return sendResponse(res, 200, 'Order cancelled by admin');
});

// Admin change status of order
const changeOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { id } = req.user;
    const { status, notes } = req.body;

    const order = await adminOrderService.changeOrderStatus(orderId, status, notes, id);
    return sendResponse(res, 200, 'Order status updated', order);
});

const movePendingToProcessing = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { id } = req.user;
    const { notes } = req.body;

    const order = await adminOrderService.pendingToProcessingLogic(orderId, notes, id);

    res.locals.auditLog = {
        entity_id: orderId,
        description: `Processed order "${orderId}"`,
        before_data: { status: 'Pending' },
        after_data: { status: 'Processing' },
    };
    return sendResponse(res, 200, 'Order moved to Processing', order);
});

const moveProcessingToShipping = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { notes, shipping_price, shipping_company, order_reference_number } = req.body;

    const order = await adminOrderService.processingToShippingLogic(
        orderId,
        notes,
        shipping_price,
        shipping_company,
        order_reference_number
    );

    res.locals.auditLog = {
        entity_id: orderId,
        description: `Shipped order "${orderId}"`,
        before_data: { status: 'Processing' },
        after_data: { status: 'Shipping' },
    };
    return sendResponse(res, 200, 'Order moved to Shipping', order);
});

const moveShippingToDelivered = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await adminOrderService.shippingToDeliveredLogic(orderId, notes);

    res.locals.auditLog = {
        entity_id: orderId,
        description: `Delivered order "${orderId}"`,
        before_data: { status: 'Shipping' },
        after_data: { status: 'Delivered' },
    };
    return sendResponse(res, 200, 'Order moved to Delivered', order);
});

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    getOrderStatusHistory,
    adminCancelOrder,
    changeOrderStatus,
    movePendingToProcessing,
    moveProcessingToShipping,
    moveShippingToDelivered,
};
