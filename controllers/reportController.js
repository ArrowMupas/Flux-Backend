const reportModel = require('../models/reportModel');
const asyncHandler = require('express-async-handler');
const HttpError = require('../helpers/errorHelper');
const sendResponse = require('../middlewares/responseMiddleware');

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

module.exports = {
    getSalesSummary,
    getTopProducts,
    getSalesPerDay,
};
