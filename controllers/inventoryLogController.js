const InventoryLog = require('../models/inventoryHistoryModel');

// Get all inventory logs
const getAllInventoryLogs = async (req, res) => {
    try {
        const inventoryLogs = await InventoryLog.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: inventoryLogs.length,
            data: inventoryLogs,
        });
    } catch (error) {
        console.error('Error fetching inventory logs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching inventory logs',
            error: error.message,
        });
    }
};

// Get inventory logs with pagination
const getInventoryLogsPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const inventoryLogs = await InventoryLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

        const total = await InventoryLog.countDocuments();

        res.status(200).json({
            success: true,
            data: inventoryLogs,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total: total,
            },
        });
    } catch (error) {
        console.error('Error fetching paginated inventory logs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching inventory logs',
            error: error.message,
        });
    }
};

// Get inventory logs by product ID
const getInventoryLogsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const inventoryLogs = await InventoryLog.find({ productId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: inventoryLogs.length,
            data: inventoryLogs,
        });
    } catch (error) {
        console.error('Error fetching inventory logs by product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching inventory logs',
            error: error.message,
        });
    }
};

module.exports = {
    getAllInventoryLogs,
    getInventoryLogsPaginated,
    getInventoryLogsByProduct,
};
