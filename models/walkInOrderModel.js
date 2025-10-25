const pool = require('../database/pool');
const HttpError = require('../helpers/errorHelper');

// Create a walk-in sale
const createOrder = async (orderData, connection = pool) => {
    const [result] = await connection.query(`INSERT INTO walk_in_sales SET ?`, orderData);
    return result.insertId;
};

// Add items to the walk-in sale
const addOrderItem = async (itemData, connection = pool) => {
    const [result] = await connection.query(`INSERT INTO walk_in_sale_items SET ?`, itemData);
    return result.insertId;
};

// Deduct stock for a product when an item is added to the order
const deductStock = async (productId, quantity, connection) => {
    const [rows] = await connection.query(
        `
        SELECT 
            p.stock_quantity - IFNULL(SUM(r.quantity), 0) AS available_stock
        FROM 
            products p
        LEFT JOIN 
            product_reservations r ON r.product_id = p.id
        WHERE 
            p.id = ?
        GROUP BY 
            p.id
        FOR UPDATE
        `,
        [productId]
    );

    const availableStock = rows[0]?.available_stock ?? 0;
    if (availableStock < quantity) {
        throw new HttpError(400, `Not enough available stock for product ${productId}`);
    }

    await connection.query(
        `
        UPDATE products 
        SET stock_quantity = stock_quantity - ? 
        WHERE id = ?
        `,
        [quantity, productId]
    );
};

// Update the total amount of a walk-in sale
const updateOrderTotal = async (saleId, totalAmount, connection = pool) => {
    const [result] = await connection.query(`UPDATE walk_in_sales SET total_amount = ? WHERE id = ?`, [
        totalAmount,
        saleId,
    ]);

    if (result.affectedRows === 0) {
        throw new Error(`Order with ID ${saleId} not found.`);
    }

    return result;
};

// Get all walk-in sales with their items
const getAllWalkInSalesWithItems = async () => {
    const connection = await pool.getConnection();

    try {
        const [sales] = await connection.query(`SELECT * FROM walk_in_sales ORDER BY sale_date DESC`);
        if (sales.length === 0) return [];

        const saleIds = sales.map((sale) => sale.id);
        const [items] = await connection.query(`SELECT * FROM walk_in_sale_items WHERE sale_id IN (?)`, [saleIds]);

        const salesWithItems = sales.map((sale) => {
            const saleItems = items.filter((item) => item.sale_id === sale.id);
            return {
                ...sale,
                items: saleItems,
            };
        });

        return salesWithItems;
    } finally {
        connection.release();
    }
};

const getWalkInOrdersByDateRange = async (startDate, endDate, connection = pool) => {
    const [walkInData] = await connection.query(
        `SELECT id, customer_name, sale_date, total_amount, 'Cash' as payment_method
        FROM walk_in_sales
        WHERE sale_date BETWEEN ? AND ?
        ORDER BY sale_date DESC
        `,
        [startDate, `${endDate} 23:59:59`]
    );
    return walkInData;
};

module.exports = {
    createOrder,
    addOrderItem,
    deductStock,
    updateOrderTotal,
    getAllWalkInSalesWithItems,
    getWalkInOrdersByDateRange,
};
