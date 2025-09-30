const salesService = require('../services/salesService');

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

module.exports = {
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getYearlySales
};