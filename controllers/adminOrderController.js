const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const adminOrderService = require('../services/adminOrderService');
const HttpError = require('../helpers/errorHelper');
const notificationModel = require('../models/notificationModel');

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
    const io = req.app.get('io');

    const order = await adminOrderService.adminCancelOrder(orderId, notes, id);

    if (order?.user_id) {
        await notificationModel.createNotification({
            user_id: order.user_id,
            type: 'warning',
            title: 'Order Cancelled',
            message: `Your order #${orderId} is now cancelled.`,
            order_id: orderId,
        });

        io.to(`user_${order.user_id}`).emit('order:update', {
            type: 'warning',
            message: `Your order #${orderId} is now  cancelled`,
            orderId,
            newStatus: 'Cancelled',
        });
    }

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
    const io = req.app.get('io');

    const order = await adminOrderService.pendingToProcessingLogic(orderId, notes, id);

    if (order?.user_id) {
        await notificationModel.createNotification({
            user_id: order.user_id,
            type: 'info',
            title: 'Order Procesed',
            message: `Your order #${orderId} is now being processed.`,
            order_id: orderId,
        });

        io.to(`user_${order.user_id}`).emit('order:update', {
            type: 'info',
            message: `Your order #${orderId} is now being processed 🏭`,
            orderId,
            newStatus: 'Processing',
        });
    }

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
    const io = req.app.get('io');

    const order = await adminOrderService.processingToShippingLogic(
        orderId,
        notes,
        shipping_price,
        shipping_company,
        order_reference_number
    );

    if (order?.user_id) {
        // Save to DB
        await notificationModel.createNotification({
            user_id: order.user_id,
            type: 'info',
            title: 'Order Shipped',
            message: `Your order #${orderId} has been shipped via ${shipping_company}.`,
            order_id: orderId,
        });

        // Emit via socket
        io.to(`user_${order.user_id}`).emit('order:update', {
            type: 'info',
            message: `Your order #${orderId} has been shipped via ${shipping_company} 🚚`,
            orderId,
            newStatus: 'Shipping',
        });
    }

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
    const io = req.app.get('io');

    const order = await adminOrderService.shippingToDeliveredLogic(orderId, notes);

    if (order?.user_id) {
        // Save to DB
        await notificationModel.createNotification({
            user_id: order.user_id,
            type: 'success',
            title: 'Order Delivered',
            message: `Your order #${orderId} has been delivered successfully.`,
            order_id: orderId,
        });

        // Emit via socket
        io.to(`user_${order.user_id}`).emit('order:update', {
            type: 'success',
            message: `Your order #${orderId} has been delivered 🎉`,
            orderId,
            newStatus: 'Delivered',
        });
    }

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
