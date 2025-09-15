const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const dashboardService = require('../services/dashboardService');

const getDashboardMetrics = asyncHandler(async (req, res) => {
    const metrics = await dashboardService.getDashboardMetrics();
    return sendResponse(res, 200, 'Dashboard metrics retrieved successfully', metrics);
});

module.exports = {
    getDashboardMetrics,
};