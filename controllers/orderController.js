const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const orderModel = require('../models/orderModel');
const orderService = require('../services/orderService');
const HttpError = require('../helpers/errorHelper');

// Create order
const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { payment_method, address, notes, reference_number, account_name } = req.body;

    const result = await orderService.createOrder(userId, {
        payment_method,
        address,
        notes,
        reference_number,
        account_name,
    });

    return sendResponse(res, 200, 'Order Created', result);
});

// Get orders with optional filters
const getOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Normalize to arrays always
    const status = [].concat(req.query.status || []);
    const paymentMethods = [].concat(req.query.payment_method || []);

    const data = await orderService.getOrders(userId, { status, payment_methods: paymentMethods });

    return sendResponse(res, 200, 'Orders retrieved', data);
});

// Get order status history
const getOrderStatusHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.orderId;

    const history = await orderService.getOrderStatusHistory(userId, orderId);
    return sendResponse(res, 200, 'Order status history retrieved', history);
});

// Cancel Order
const cancelOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.orderId;
    const { notes } = req.body;

    const message = await orderService.cancelOrder(userId, orderId, notes);
    return sendResponse(res, 200, message);
});

// Get order by ID
const getOrderById = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const { id } = req.user;

    const order = await orderModel.getOrderById(orderId);
    if (!order) {
        throw new HttpError(404, 'No order');
    }

    // Makes sure user is accessing own order
    if (order.customer_id !== id) {
        throw new HttpError(403, 'Not Authorized');
    }

    const items = await orderModel.getOrderItems(orderId);

    const result = {
        ...order,
        items,
    };

    return sendResponse(res, 200, 'Order retrieved', result);
});

module.exports = {
    createOrder,
    getOrders,
    getOrderStatusHistory,
    cancelOrder,
    getOrderById,
};
