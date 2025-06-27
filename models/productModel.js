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

// Function to get a product by ID
const getProductById = async (id) => {
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return product[0];
};

// Function to add a new product
const addProduct = async (id, name, category, stock_quantity, price, image, description) => {
    const [result] = await pool.query(
        'INSERT INTO products (id, name, category, stock_quantity, price, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, category, stock_quantity, price, image, description]
    );
    return result;
};

// Function to update a product
const updateProduct = async (id, name, category, price, image, description) => {
    const [result] = await pool.query(
        'UPDATE products SET name = ?, category = ?, price = ?, image = ?, description = ? WHERE id = ?',
        [name, category, price, image, description, id]
    );
    return result;
};

// Function to update is_active status of a product
const updateProductActiveStatus = async (productId, isActive) => {
    await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [isActive, productId]);
};

// Function to update stock quantity and price of a product
const updateProductStockAndPrice = async (productId, stockQuantity, price) => {
    await pool.query('UPDATE products SET stock_quantity = ?, price = ? WHERE id = ?', [
        stockQuantity,
        price,
        productId,
    ]);
};

// Function to delete a product
const deleteProduct = async (id) => {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result;
};

// Function to check and reserve stock for a product
const checkAndReserveStock = async (productId, quantity, orderId, connection) => {
    const [rows] = await connection.query(
        `
        SELECT 
            p.stock_quantity - IFNULL(SUM(r.quantity), 0) AS available_stock
        FROM 
            products p
        LEFT JOIN 
            product_reservations r ON p.id = r.product_id
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

    // Reserve stock
    await connection.query(
        `INSERT INTO product_reservations (product_id, order_id, quantity)
         VALUES (?, ?, ?)`,
        [productId, orderId, quantity]
    );
};

// Get price of a product
const getProductPrice = async (productId, connection = pool) => {
    const [rows] = await connection.query('SELECT price FROM products WHERE id = ?', [productId]);

    if (rows.length === 0) {
        throw new Error(`Product with ID ${productId} not found.`);
    }

    return rows[0].price;
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
};
