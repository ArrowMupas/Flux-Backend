const asyncHandler = require('express-async-handler');
const productModel = require('../models/productModel');
const entityExistHelper = require('../helpers/entityExistHelper');
const HttpError = require('../helpers/errorHelper');

// Get all products
const getAllProducts = asyncHandler(async (req, res) => {
    const products = await productModel.getAllProducts();
    res.status(200).json(products);
});

// Get all products
const getAllProductsAdmin = asyncHandler(async (req, res) => {
    const products = await productModel.getAllProductsAdmin();
    res.status(200).json(products);
});

// Get a product by ID
const getProductById = asyncHandler(async (req, res) => {
    const product = await productModel.getProductById(req.params.id);

    entityExistHelper(product, res, 404, `Cannot find product with ID ${req.params.id}`);

    res.status(200).json(product);
});

// Create a new product
const createProduct = asyncHandler(async (req, res) => {
    const { id, name, category, stock_quantity, price, image, description } = req.body;

    await productModel.addProduct(id, name, category, stock_quantity, price, image, description);

    res.status(201).json({ id, ...req.body });
});

// Update a product
const updateProduct = asyncHandler(async (req, res) => {
    const { name, category, price, image, description } = req.body;

    const result = await productModel.updateProduct(
        req.params.id,
        name,
        category,
        price,
        image,
        description
    );

    if (result.affectedRows === 0) {
        throw new HttpError(404, `Cannot update product with ID ${req.params.id}`);
    }

    res.status(200).json({ message: 'Product updated successfully' });
});

// Update product is_active status
const updateProductActiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    await productModel.updateProductActiveStatus(id, is_active);
    res.status(200).json({ message: `Product ${id} is now ${is_active ? 'active' : 'inactive'}` });
});

// Update product stock and price
const updateProductStockAndPrice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { restock_quantity, price } = req.body;

    // Get current product
    const product = await productModel.getProductById(id);
    if (!product) {
        throw new HttpError(404, `Product with ID ${id} not found`);
    }

    // Add to current stock
    const newStock = product.stock_quantity + restock_quantity;
    if (newStock < 0) {
        throw new HttpError(400, `Resulting stock cannot be negative`);
    }

    await productModel.updateProductStockAndPrice(id, newStock, price);

    res.status(200).json({ message: `Product ${id} updated with new stock and price.` });
});

// Delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    const result = await productModel.deleteProduct(req.params.id);
    if (result.affectedRows === 0) {
        throw new HttpError(404, `Cannot delete product with ID ${req.params.id}`);
    }
    res.status(200).json({ message: 'Product deleted successfully' });
});

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductActiveStatus,
    updateProductStockAndPrice,
    getAllProductsAdmin,
};
