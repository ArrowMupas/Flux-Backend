const salesService = require('../services/salesService');
const { generateOrdersPDF } = require('../services/pdfService');
const orderModel = require('../models/orderModel');
const walkInOrderModel = require('../models/walkInOrderModel');
const dayjs = require('dayjs');

const getDailySales = async (req, res) => {
    try {
        const metrics = await salesService.getDailySalesMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Daily sales error:', error);
        res.status(500).json({ message: 'Error fetching daily sales metrics' });
    }
};

const getWeeklySales = async (req, res) => {
    try {
        const metrics = await salesService.getWeeklySalesMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Weekly sales error:', error);
        res.status(500).json({ message: 'Error fetching weekly sales metrics' });
    }
};

const getMonthlySales = async (req, res) => {
    try {
        const metrics = await salesService.getMonthlySalesMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Monthly sales error:', error);
        res.status(500).json({ message: 'Error fetching monthly sales metrics' });
    }
};

const getYearlySales = async (req, res) => {
    try {
        const metrics = await salesService.getYearlySalesMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Yearly sales error:', error);
        res.status(500).json({ message: 'Error fetching yearly sales metrics' });
    }
};

//PDF Generator
const generateOrdersPDFReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType = 'custom' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const startNormalized = dayjs(startDate).format('YYYY-MM-DD');
        const endNormalized = dayjs(endDate).format('YYYY-MM-DD');

        const start = dayjs(startNormalized).startOf('day');
        const end = dayjs(endNormalized).endOf('day');

        if (!start.isValid() || !end.isValid()) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (end.isBefore(start)) {
            return res.status(400).json({ message: 'End date cannot be before start date' });
        }

       const onlineOrders = await orderModel.getOrdersByDateRange(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));

       const walkInOrders = await walkInOrderModel.getWalkInOrdersByDateRange(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));

       const formattedWalkIn = walkInOrders.map((o) => ({
        id: `W-${o.id}`,
        customer_name: o.customer_name || 'Walk-In',
        order_date: o.sale_date,
        payment_method: 'Cash',
        total_amount: o.total_amount,
        type: 'Walk-In'
       }));

       const formattedOnline = onlineOrders.map((o) => ({
        ...o,
        type: 'Online'
       }));

       const combine = [...formattedOnline, ...formattedWalkIn];
       combine.sort((a, b) => new Date(a.order_date) - new Date (b.order_date));

       if (combine.length === 0) {
        return res.status(404).json({ message: 'No orders found for this selected date range!'});
       }

        const dateRange = `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;

        // Generate PDF
        const pdfBuffer = await generateOrdersPDF(combine, dateRange, reportType);

        const startFormatted = dayjs(startNormalized).format('YYYY-MM-DD');
        const endFormatted = dayjs(endNormalized).format('YYYY-MM-DD');

        const filename =
            startFormatted === endFormatted
                ? `sales-report-${startFormatted}.pdf`
                : `sales-report-${startFormatted}-to-${endFormatted}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.end(pdfBuffer);
    } catch (error) {
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Error generating PDF report',
            error: error.message,
        });
    }
};

module.exports = {
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getYearlySales,
    generateOrdersPDFReport,
};
