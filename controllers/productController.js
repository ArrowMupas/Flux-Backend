const productModel = require('../models/productModel');
const asyncHandler = require('express-async-handler');
const entityExistHelper = require('../helpers/entityExistHelper');
const HttpError = require('../helpers/errorHelper');

// Get all products
const getAllProducts = asyncHandler(async (req, res) => {
    const products = await productModel.getAllProducts();
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

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
