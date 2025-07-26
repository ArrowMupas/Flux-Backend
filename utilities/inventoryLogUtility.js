const db = require('../database/pool'); // adjust as needed
const asyncHandler = require('express-async-handler');

const logInventoryChange = asyncHandler(
    async ({
        productId,
        orderId = null,
        userId = null,
        adminId = null,
        action,
        changeAvailable,
        changeReserved = 0,
        oldAvailable,
        oldReserved = 0,
        newAvailable,
        newReserved = 0,
        reason = null,
        dbConnection = db, // use default db if no custom connection is provided
    }) => {
        await dbConnection.query(
            `
            INSERT INTO inventory_logs 
            (
                product_id,
                order_id,
                user_id,
                admin_id,
                action,
                change_available,
                change_reserved,
                old_available,
                old_reserved,
                new_available,
                new_reserved,
                reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                productId,
                orderId,
                userId,
                adminId,
                action,
                changeAvailable,
                changeReserved,
                oldAvailable,
                oldReserved,
                newAvailable,
                newReserved,
                reason,
            ]
        );
    }
);

module.exports = { logInventoryChange };
