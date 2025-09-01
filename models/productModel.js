const pool = require('../database/pool');
const HttpError = require('../helpers/errorHelper');

const getAllProducts = async () => {
    const [products] = await pool.query('SELECT * FROM products WHERE is_active = TRUE');
    return products;
};

const getAllProductsAdmin = async () => {
    const [products] = await pool.query('SELECT * FROM products');
    return products;
};

const getProductById = async (id) => {
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return product[0];
};

const addProduct = async (id, name, category, stock_quantity, price, image, description) => {
    const [result] = await pool.query(
        'INSERT INTO products (id, name, category, stock_quantity, price, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, category, stock_quantity, price, image, description]
    );
    return result;
};

const updateProduct = async (id, name, category, price, image, description) => {
    const [result] = await pool.query(
        'UPDATE products SET name = ?, category = ?, price = ?, image = ?, description = ? WHERE id = ?',
        [name, category, price, image, description, id]
    );
    return result;
};

const updateProductActiveStatus = async (productId, isActive) => {
    const [result] = await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [
        isActive,
        productId,
    ]);
    return result;
};

const updateProductStockAndPrice = async (productId, stockChange, price) => {
    // Atomically update stock and price, returning the new stock
    const [result] = await pool.query(
        `UPDATE products
         SET stock_quantity = stock_quantity + ?, price = ?
         WHERE id = ?`,
        [stockChange, price, productId]
    );

    // Optionally, get the new stock value
    const [[updatedProduct]] = await pool.query(
        'SELECT stock_quantity, price FROM products WHERE id = ?',
        [productId]
    );

    return updatedProduct; // { stock_quantity: newStock, price }
};
const deleteProduct = async (id) => {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result;
};

const getProductPrice = async (productId, connection = pool) => {
    const [rows] = await connection.query('SELECT price FROM products WHERE id = ?', [productId]);

    if (rows.length === 0) {
        throw new HttpError(404, `Product ${productId} not found`);
    }

    return rows[0].price;
};

const checkAndReserveStock = async (productId, quantity, orderId, connection) => {
    // Lock product row for update
    const [rows] = await connection.query(
        `
        SELECT 
            stock_quantity,
            reserved_quantity
        FROM 
            products
        WHERE 
            id = ?
        FOR UPDATE
        `,
        [productId]
    );

    if (rows.length === 0) {
        throw new HttpError(404, `Product ${productId} not found`);
    }

    const { stock_quantity, reserved_quantity } = rows[0];

    const oldAvailable = stock_quantity - reserved_quantity;
    const oldReserved = reserved_quantity;

    if (oldAvailable < quantity) {
        throw new HttpError(400, `Not enough available stock for product ${productId}`);
    }

    const newReserved = reserved_quantity + quantity;
    const newAvailable = stock_quantity - newReserved;

    // Update reserved quantity in products table
    await connection.query(`UPDATE products SET reserved_quantity = ? WHERE id = ?`, [
        newReserved,
        productId,
    ]);

    // Add product reservation entry
    await connection.query(
        `INSERT INTO product_reservations (product_id, order_id, quantity)
         VALUES (?, ?, ?)`,
        [productId, orderId, quantity]
    );

    return {
        oldAvailable,
        newAvailable,
        oldReserved,
        newReserved,
    };
};

// Refactor starts here
const getProductStockForUpdate = async (productId, connection) => {
    const [rows] = await connection.query(
        `
        SELECT stock_quantity, reserved_quantity
        FROM products
        WHERE id = ?
        FOR UPDATE
        `,
        [productId]
    );
    return rows[0] || null;
};

const updateReservedQuantity = async (productId, newReserved, connection) => {
    await connection.query(`UPDATE products SET reserved_quantity = ? WHERE id = ?`, [
        newReserved,
        productId,
    ]);
};

const createProductReservation = async (productId, orderId, quantity, connection) => {
    await connection.query(
        `
        INSERT INTO product_reservations (product_id, order_id, quantity)
        VALUES (?, ?, ?)
        `,
        [productId, orderId, quantity]
    );
};

module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    checkAndReserveStock,
    getProductPrice,
    updateProductActiveStatus,
    updateProductStockAndPrice,
    getAllProductsAdmin,
    getProductStockForUpdate,
    updateReservedQuantity,
    createProductReservation,
};
