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

    const result = await productModel.addProduct(
        id,
        name,
        category,
        stock_quantity,
        price,
        image,
        description
    );

    res.status(201).json({ id, ...req.body });
});

// Update product is_active status
const updateProductActiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ message: 'is_active must be a boolean' });
    }

    await productModel.updateProductActiveStatus(id, is_active);
    res.status(200).json({ message: `Product ${id} is now ${is_active ? 'active' : 'inactive'}` });
});

// Update a product
const updateProduct = asyncHandler(async (req, res) => {
    const { name, category, stock_quantity, price, image, description, is_active } = req.body;

    const result = await productModel.updateProduct(
        req.params.id,
        name,
        category,
        stock_quantity,
        price,
        image,
        description,
        is_active
    );

    if (result.affectedRows === 0) {
        throw new HttpError(404, `Cannot update product with ID ${req.params.id}`);
    }

    res.status(200).json({ message: 'Product updated successfully' });
});

// Delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    const result = await productModel.deleteProduct(req.params.id);
    if (result.affectedRows === 0) {
        throw new HttpError(404, `Cannot delete product with ID ${req.params.id}`);
    }
    res.status(200).json({ message: 'Product deleted successfully' });
});

const updateProductStockAndPrice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stock_quantity, price } = req.body;

    if (typeof stock_quantity !== 'number' || stock_quantity < 0) {
        return res.status(400).json({ message: 'Invalid stock_quantity' });
    }
    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: 'Invalid price' });
    }

    await productModel.updateProductStockAndPrice(id, stock_quantity, price);

    res.status(200).json({ message: `Product ${id} updated with new stock and price.` });
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
