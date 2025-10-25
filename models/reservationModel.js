const HttpError = require('../helpers/errorHelper');

/* Note to self, never forget to make sure all things inside a transaction
uses the same damn pool, I'm so sorry too sleepy, will refactor in future */
const deductReservedStock = async (orderId, connection) => {
    // Step 1: Fetch reservation + current stock info, lock rows
    const [items] = await connection.query(
        `
        SELECT 
            pr.product_id,
            pr.quantity,
            p.stock_quantity,
            p.reserved_quantity
        FROM product_reservations pr
        JOIN products p ON p.id = pr.product_id
        WHERE pr.order_id = ?
        FOR UPDATE
        `,
        [orderId]
    );

    if (items.length === 0) {
        throw new HttpError(404, 'No reserved items found for this order');
    }

    const result = [];

    // Step 2: Process each product
    for (const item of items) {
        const { product_id, quantity, stock_quantity, reserved_quantity } = item;

        const oldReserved = reserved_quantity;
        const oldAvailable = stock_quantity - reserved_quantity;

        if (quantity <= 0) {
            throw new HttpError(
                400,
                `Invalid reservation quantity (${quantity}) for product ${product_id}. Quantity must be positive.`
            );
        }

        if (quantity > reserved_quantity) {
            throw new HttpError(
                400,
                `Attempted to release more reserved quantity (${quantity}) than available (${reserved_quantity}) for product ${product_id}. Data integrity issue detected.`
            );
        }

        const newReserved = reserved_quantity - quantity;
        const newStock = stock_quantity - quantity;
        const newAvailable = newStock - newReserved;

        if (newStock < 0) {
            throw new HttpError(400, `Stock quantity cannot be negative for product ${product_id}`);
        }

        if (newReserved < 0) {
            throw new HttpError(400, `Reserved quantity cannot be negative for product ${product_id}`);
        }

        // Step 3: Update product's stock and reserved quantity
        await connection.query(
            `
            UPDATE products
            SET stock_quantity = ?, reserved_quantity = ?
            WHERE id = ?
            `,
            [newStock, newReserved, product_id]
        );

        result.push({
            productId: product_id,
            changeAvailable: -quantity,
            changeReserved: -quantity,
            oldAvailable,
            newAvailable,
            oldReserved,
            newReserved,
        });
    }

    // Step 4: Remove reservation records
    await connection.query(`DELETE FROM product_reservations WHERE order_id = ?`, [orderId]);

    // Step 5: Return results for logging
    return result;
};

// Release reservation (used in cancellation)
const releaseReservedStock = async (orderId, connection) => {
    await connection.query(
        `
        UPDATE products p
        JOIN product_reservations pr ON p.id = pr.product_id
        SET p.reserved_quantity = p.reserved_quantity - pr.quantity
        WHERE pr.order_id = ?
        `,
        [orderId]
    );

    await connection.query(`DELETE FROM product_reservations WHERE order_id = ?`, [orderId]);
};

module.exports = {
    deductReservedStock,
    releaseReservedStock,
};
