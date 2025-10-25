const InventoryLog = require('../models/inventoryHistoryModel');
const asyncHandler = require('express-async-handler');

const logInventoryChange = asyncHandler(
    async ({
        productId,
        orderId = null,
        userId = null,
        adminId = null,
        action,
        changeAvailable = 0,
        changeReserved = 0,
        reason = null,
    }) => {
        try {
            const logEntry = new InventoryLog({
                productId,
                orderId,
                userId,
                adminId,
                action,
                changeAvailable,
                changeReserved,
                reason,
            });

            await logEntry.save();
        } catch (error) {
            console.error('Inventory logging failed:', error);
        }
    }
);

module.exports = { logInventoryChange };
