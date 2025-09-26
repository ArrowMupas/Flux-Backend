const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const reportModel = require('../models/reportModel');
const dayjs = require('dayjs');

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
        weekCount: weeklySales.length,
    };

    return sendResponse(res, 200, 'Weekly sales data retrieved', result);
});

const getDailySales = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const endDate = dayjs();
    const startDate = endDate.subtract(days - 1, 'day');
    const start = startDate.format('YYYY-MM-DD');
    const end = endDate.format('YYYY-MM-DD');
    const endWithTime = `${end} 23:59:59`;

    const rows = await reportModel.fetchDailySales(start, endWithTime);

    const salesMap = {};
    rows.forEach((row) => {
        const dateKey = dayjs(row.date).format('YYYY-MM-DD');
        salesMap[dateKey] = Number(row.daily_sales);
    });

    const allDates = [];
    let currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        allDates.push({
            date: dateStr,
            daily_sales: salesMap[dateStr] || 0,
        });
        currentDate = currentDate.add(1, 'day');
    }

    const result = {
        days: allDates,
        dayCount: allDates.length,
    };

    return sendResponse(res, 200, 'Daily sales data retrieved', result);
});

const getDashboardMetrics = asyncHandler(async (req, res) => {
    const report = await reportModel.fetchDashboardMetrics();

    const onlineMetrics = {
        count: report.online_orders_count,
        sales: report.online_total_sales,
        items: report.online_items_sold,
    };

    const walkInMetrics = {
        count: report.walkin_orders_count,
        sales: report.walkin_total_sales,
        items: report.walkin_items_sold,
    };

    const result = {
        totalCustomers: report.total_customers || 0,
        totalOnlineOrders: onlineMetrics.count,
        totalWalkInOrders: walkInMetrics.count,
        totalSales: parseInt(onlineMetrics.sales) + parseInt(walkInMetrics.sales),
        totalItemsSold: parseInt(onlineMetrics.items) + parseInt(walkInMetrics.items),
    };

    return sendResponse(res, 200, 'Dashboard metrics retrieved successfully', result);
});

module.exports = {
    getSalesSummary,
    getTopProducts,
    getSalesPerDay,
    getUserReport,
    getSalesSummaryByStatus,
    getWeeklySales,
    getDailySales,
    getDashboardMetrics,
};
