const pool = require('../database/pool');
const HttpError = require('../helpers/errorHelper');

// Function to get all products
const getAllProducts = async () => {
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
const updateProduct = async (
    id,
    name,
    category,
    stock_quantity,
    price,
    image,
    description,
    is_active
) => {
    const [result] = await pool.query(
        'UPDATE products SET name = ?, category = ?, stock_quantity = ?, price = ?, image = ?, description = ?, is_active = ? WHERE id = ?',
        [name, category, stock_quantity, price, image, description, is_active, id]
    );
    return result;
};

// Function to delete a product
const deleteProduct = async (id) => {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result;
};

const checkAndReserveStock = async (productId, quantity, orderId, connection) => {
    // Check available stock considering reservations, and lock row
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

module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    checkAndReserveStock,
};
