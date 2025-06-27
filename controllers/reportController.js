const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const reportModel = require('../models/reportModel');

// Generate sales summary report
const getSalesSummary = asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const summary = await reportModel.fetchSalesSummary(start, end);

    const result = {
        startDate: start,
        endDate: end,
        ...summary,
    };

    return sendResponse(res, 200, 'Sales Summary Generated', result);
});

// Generate sales summary report by status
const getSalesSummaryByStatus = asyncHandler(async (req, res) => {
    const { start, end } = req.query;

    const data = await reportModel.fetchSalesSummaryByStatus(start, end);

    const result = {
        startDate: start,
        endDate: end,
        data,
    };

    return sendResponse(res, 200, 'Sales Summary Generated', result);
});

// Get top products sold
const getTopProducts = asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const summary = await reportModel.fetchTopProducts(start, end);

    const result = {
        startDate: start,
        endDate: end,
        topProducts: summary,
    };

    return sendResponse(res, 200, 'Top Products Retrieved', result);
});

// Get sales per day report
const getSalesPerDay = asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const summary = await reportModel.fetchSalesPerDay(start, end);

    const result = {
        startDate: start,
        endDate: end,
        salesPerDay: summary,
    };

    return sendResponse(res, 200, 'Daily Sales Data Retrieved', result);
});

// Get user report
const getUserReport = asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const summary = await reportModel.fetchUserReport(start, end);

    const result = {
        startDate: start,
        endDate: end,
        ...summary,
    };

    return sendResponse(res, 200, 'User Report Retrieved', result);
});

module.exports = {
    getSalesSummary,
    getTopProducts,
    getSalesPerDay,
    getUserReport,
    getSalesSummaryByStatus,
};
