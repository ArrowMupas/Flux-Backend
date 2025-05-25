const pool = require('../database/pool');

const deductReservedStock = async (orderId, connection) => {
    await connection.query(
        `
        UPDATE products p
        JOIN product_reservations pr ON pr.product_id = p.id
        SET p.stock_quantity = p.stock_quantity - pr.quantity
        WHERE pr.order_id = ?;
    `,
        [orderId]
    );

    await connection.query(`DELETE FROM product_reservations WHERE order_id = ?`, [orderId]);
};

// Release reservation (used in cancellation)
const releaseReservedStock = async (orderId, connection) => {
    await connection.query(`DELETE FROM product_reservations WHERE order_id = ?`, [orderId]);
};

module.exports = {
    deductReservedStock,
    releaseReservedStock,
};
