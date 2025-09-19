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

// Chart Report
const getWeeklySales = asyncHandler(async (req, res) => {
    const { weeks = 7 } = req.query;
    const weeklySales = await reportModel.fetchWeeklySales(parseInt(weeks));

    const result = {
        weeks: weeklySales,
        weekCount: weeklySales.length
    };

    return sendResponse(res, 200, 'Weekly sales data retrieved', result);
});

const getDailySales = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;
    const dailySales = await reportModel.fetchDailySales(parseInt(days));

    const result = {
        days: dailySales,
        dayCount: dailySales.length
    };

    return sendResponse(res, 200, 'Daily sales data retrieved', result);
});

module.exports = {
    getSalesSummary,
    getTopProducts,
    getSalesPerDay,
    getUserReport,
    getSalesSummaryByStatus,
    getWeeklySales,
    getDailySales
};
