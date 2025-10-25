const express = require('express');
const router = express.Router();
const {
    getAllInventoryLogs,
    getInventoryLogsPaginated,
    getInventoryLogsByProduct,
} = require('../controllers/inventoryLogController'); // Adjust path as needed

// @route   GET /api/inventory-logs
// @desc    Get all inventory logs
router.get('/', getAllInventoryLogs);

// @route   GET /api/inventory-logs/paginated
// @desc    Get inventory logs with pagination
router.get('/paginated', getInventoryLogsPaginated);

// @route   GET /api/inventory-logs/product/:productId
// @desc    Get inventory logs by product ID
router.get('/product/:productId', getInventoryLogsByProduct);

module.exports = router;
