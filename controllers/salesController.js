const salesService = require('../services/salesService');
const { generateOrdersPDF } = require('../services/pdfService');
const orderModel = require('../models/orderModel');
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

        const start = dayjs(startDate).startOf('day');
        const end = dayjs(endDate).endOf('day');

        if (!start.isValid() || !end.isValid()) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (end.isBefore(start)) {
            return res.status(400).json({ message: 'End date cannot be before start date' });
        }

        const orders = await orderModel.getOrdersByDateRange(
            start.format('YYYY-MM-DD'),
            end.format('YYYY-MM-DD')
        );

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for the selected date range' });
        }

        const dateRange = `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
        
        // Generate PDF
        const pdfBuffer = await generateOrdersPDF(orders, dateRange, reportType);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=orders-report-${start.format('YYYY-MM-DD')}-to-${end.format('YYYY-MM-DD')}.pdf`);
        
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error generating PDF report',
            error: error.message 
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