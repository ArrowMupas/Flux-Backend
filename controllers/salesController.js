const salesService = require('../services/salesService');

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

module.exports = {
    getWeeklySales,
    getMonthlySales
};