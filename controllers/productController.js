const asyncHandler = require('express-async-handler');
const productModel = require('../models/productModel');
const HttpError = require('../helpers/errorHelper');
const sendResponse = require('../middlewares/responseMiddleware');
const { logInventoryChange } = require('../utilities/inventoryLogUtility');

const getAllProducts = asyncHandler(async (req, res) => {
    const products = await productModel.getAllProducts();
    res.status(200).json(products);
});

const getAllProductsAdmin = asyncHandler(async (req, res) => {
    const products = await productModel.getAllProductsAdmin();
    res.status(200).json(products);
});

const getProductById = asyncHandler(async (req, res) => {
    const product = await productModel.getProductById(req.params.id);

    if (!product) {
        throw new HttpError(404, 'Product not found');
    }

    res.status(200).json(product);
});

const createProduct = asyncHandler(async (req, res) => {
    const { id, name, category, stock_quantity, price, image, description } = req.body;

    await productModel.addProduct(id, name, category, stock_quantity, price, image, description);

    res.locals.logData = {
        entity_id: id,
        description: `Created product "${name}" (ID: ${id})`,
        before_data: null,
        after_data: { id, name, category, stock_quantity, price, image, description },
    };

    sendResponse(res, 201, 'Product created successfully', { id, ...req.body });
});

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

    // Helper function to truncate long text for logging
    const truncate = (text, maxLength = 50) => {
        if (!text) {
            return '';
        }
        return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
    };

    res.locals.logData = {
        entity_id: req.params.id,
        description: `Updated "${name}" (ID: ${req.params.id})`,
        before_data: {
            name: currentProduct.name,
            category: currentProduct.category,
            price: currentProduct.price,
            image: currentProduct.image,
            description: truncate(currentProduct.description),
        },
        after_data: { name, category, price, image, description: truncate(description) },
    };

    sendResponse(res, 200, 'Product updated successfully');
});

const updateProductActiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    const product = await productModel.getProductById(id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    await productModel.updateProductActiveStatus(id, is_active);

    res.locals.logData = {
        entity_id: id,
        description: `Set product "${product.name}" (ID: ${id}) to ${
            is_active ? 'active' : 'inactive'
        }`,
        after_data: { is_active },
    };

    res.status(200).json({
        message: `Product "${product.name}" is now ${is_active ? 'active' : 'inactive'}`,
    });
});

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

    res.locals.logData = {
        entity_id: id,
        description: `Updated stock and price for "${product.name}" (ID: ${id})`,
        before_data: { stock_quantity: product.stock_quantity, price: product.price },
        after_data: { stock_quantity: newStock, price },
    };

    sendResponse(res, 200, `Product ${id} updated with new stock and price.`);
});

const deleteProduct = asyncHandler(async (req, res) => {
    const currentProduct = await productModel.getProductById(req.params.id);
    if (!currentProduct) {
        throw new HttpError(404, `Cannot find product with ID ${req.params.id}`);
    }

    const result = await productModel.deleteProduct(req.params.id);
    if (result.affectedRows === 0) {
        throw new HttpError(404, `Cannot delete product with ID ${req.params.id}`);
    }

    res.locals.logData = {
        entity_id: req.params.id,
        description: `Deleted product "${currentProduct.name}" (ID: ${req.params.id})`,
        before_data: {
            name: currentProduct.name,
        },
        after_data: null,
    };

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
