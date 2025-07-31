const asyncHandler = require('express-async-handler');
const productModel = require('../models/productModel');
const HttpError = require('../helpers/errorHelper');
const sendResponse = require('../middlewares/responseMiddleware');
const { logInventoryChange } = require('../utilities/inventoryLogUtility');

const { logProductAction } = require('../helpers/smartActivityLogger');
const { ACTION_TYPES } = require('../helpers/activityLogHelper');

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

    if (!product) {
        throw new HttpError(404, 'Product not found');
    }

    res.status(200).json(product);
});

// Create a new product
const createProduct = asyncHandler(async (req, res) => {
    const { id, name, category, stock_quantity, price, image, description } = req.body;

    await productModel.addProduct(id, name, category, stock_quantity, price, image, description);

    await logProductAction({
        req,
        actionType: ACTION_TYPES.ADD_PRODUCT,
        productId: id,
        productName: name,
        before: null,
        after: { id, name, category, stock_quantity, price, image, description },
    });

    sendResponse(res, 201, 'Product created successfully', { id, ...req.body });
});

// Update a product
const updateProduct = asyncHandler(async (req, res) => {
    const { name, category, price, image, description } = req.body;

    // Get current product data for logging
    const currentProduct = await productModel.getProductById(req.params.id);
    if (!currentProduct) {
        throw new HttpError(404, `Cannot find product with ID ${req.params.id}`);
    }

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

    const truncate = (text, maxLength = 100) => {
        if (!text) {
            return '';
        }
        return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
    };

    await logProductAction({
        req,
        actionType: ACTION_TYPES.UPDATE_PRODUCT,
        productId: req.params.id,
        productName: name,
        before: {
            name: currentProduct.name,
            category: currentProduct.category,
            price: currentProduct.price,
            image: currentProduct.image,
            description: truncate(currentProduct.description),
        },
        after: {
            name,
            category,
            price,
            image,
            description: truncate(description),
        },
    });

    sendResponse(res, 200, 'Product updated successfully');
});

// Update product is_active status
const updateProductActiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    // Get current product data for logging
    const currentProduct = await productModel.getProductById(id);
    if (!currentProduct) {
        throw new HttpError(404, `Product with ID ${id} not found`);
    }

    await productModel.updateProductActiveStatus(id, is_active);

    await logProductAction({
        req,
        actionType: is_active ? ACTION_TYPES.ACTIVATE_PRODUCT : ACTION_TYPES.DEACTIVATE_PRODUCT,
        productId: id,
        productName: currentProduct.name,
        before: { is_active: currentProduct.is_active },
        after: { is_active },
    });

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

    await logInventoryChange({
        productId: id,
        adminId: req.user?.id || null,
        action: 'add_stock',
        changeAvailable: restock_quantity,
        oldAvailable: product.stock_quantity,
        newAvailable: newStock,
        reason: `Stock restocked by ${restock_quantity}`,
    });

    await logProductAction({
        req,
        actionType: ACTION_TYPES.ADJUST_STOCK,
        productId: id,
        productName: product.name,
        before: { stock_quantity: product.stock_quantity, price: product.price },
        after: { stock_quantity: newStock, price },
        details: `Stock: ${product.stock_quantity} → ${newStock}, Price: ₱${product.price} → ₱${price}`,
    });

    sendResponse(res, 200, `Product ${id} updated with new stock and price.`);
});

// Delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    // Get current product data for logging
    const currentProduct = await productModel.getProductById(req.params.id);
    if (!currentProduct) {
        throw new HttpError(404, `Cannot find product with ID ${req.params.id}`);
    }

    const result = await productModel.deleteProduct(req.params.id);
    if (result.affectedRows === 0) {
        throw new HttpError(404, `Cannot delete product with ID ${req.params.id}`);
    }

    await logProductAction({
        req,
        actionType: ACTION_TYPES.DELETE_PRODUCT,
        productId: req.params.id,
        productName: currentProduct.name,
        before: currentProduct,
        after: null,
    });

    sendResponse(res, 200, 'Product deleted successfully');
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
