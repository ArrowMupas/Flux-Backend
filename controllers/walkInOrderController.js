const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const walkInOrderService = require('../services/walkInOrderService');

// Create order
const createWalkInSale = asyncHandler(async (req, res) => {
    const { customer_name, customer_email, items, notes, discount_amount = 0.0 } = req.body;

    const result = await walkInOrderService.createWalkInSale(
        customer_name,
        customer_email,
        items,
        discount_amount,
        notes
    );

    return sendResponse(res, 200, 'Walk-in Order Created', result);
});

// Get all walk-in orders
const getAllWalkInOrders = asyncHandler(async (req, res) => {
    const orders = await walkInOrderService.getAllWalkInSales();
    return sendResponse(res, 200, 'All walk-in sales retrieved', orders);
});

module.exports = { createWalkInSale, getAllWalkInOrders };
