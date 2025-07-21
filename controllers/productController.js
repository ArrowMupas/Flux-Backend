const asyncHandler = require('express-async-handler');
const productModel = require('../models/productModel');
const entityExistHelper = require('../helpers/entityExistHelper');
const HttpError = require('../helpers/errorHelper');
const { logActivity, ACTION_TYPES, ENTITY_TYPES, createDescription, sanitizeDataForLogging } = require('../helpers/activityLogHelper');

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

    // Log activity for admin/staff users
    if (req.user) {
        const productData = sanitizeDataForLogging({ id, name, category, stock_quantity, price, image, description });
        await logActivity(
            req.user,
            ACTION_TYPES.ADD_PRODUCT,
            ENTITY_TYPES.PRODUCT,
            id,
            createDescription(ACTION_TYPES.ADD_PRODUCT, ENTITY_TYPES.PRODUCT, id, `Product: ${name}`),
            null, // no before data for creation
            productData
        );
    }

    res.status(201).json({ id, ...req.body });
});

// Update a product
const updateProduct = asyncHandler(async (req, res) => {
    console.log('🔧 Product Update Request:', {
        productId: req.params.id,
        body: req.body,
        hasUser: !!req.user,
        userInfo: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role_name } : 'No user'
    });

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

    // Log activity for admin/staff users
    if (req.user) {
        const beforeData = sanitizeDataForLogging({
            name: currentProduct.name,
            category: currentProduct.category,
            price: currentProduct.price,
            image: currentProduct.image,
            description: currentProduct.description
        });
        const afterData = sanitizeDataForLogging({ name, category, price, image, description });
        
        await logActivity(
            req.user,
            ACTION_TYPES.UPDATE_PRODUCT,
            ENTITY_TYPES.PRODUCT,
            req.params.id,
            createDescription(ACTION_TYPES.UPDATE_PRODUCT, ENTITY_TYPES.PRODUCT, req.params.id, `Product: ${name}`),
            beforeData,
            afterData
        );
    }

    res.status(200).json({ message: 'Product updated successfully' });
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

    // Log activity for admin/staff users
    if (req.user) {
        const actionType = is_active ? ACTION_TYPES.ACTIVATE_PRODUCT : ACTION_TYPES.DEACTIVATE_PRODUCT;
        const beforeData = { is_active: currentProduct.is_active };
        const afterData = { is_active };
        
        await logActivity(
            req.user,
            actionType,
            ENTITY_TYPES.PRODUCT,
            id,
            createDescription(actionType, ENTITY_TYPES.PRODUCT, id, `Product: ${currentProduct.name}`),
            beforeData,
            afterData
        );
    }

    res.status(200).json({ message: `Product ${id} is now ${is_active ? 'active' : 'inactive'}` });
});

// Update product stock and price
const updateProductStockAndPrice = asyncHandler(async (req, res) => {
    console.log('📦 Stock Update Request:', {
        productId: req.params.id,
        body: req.body,
        hasUser: !!req.user,
        userInfo: req.user ? { 
            id: req.user.id, 
            username: req.user.username, 
            role: req.user.role || req.user.role_name,
            fullUser: req.user
        } : 'No user'
    });

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

    // Log activity for admin/staff users
    if (req.user) {
        const beforeData = {
            stock_quantity: product.stock_quantity,
            price: product.price
        };
        const afterData = {
            stock_quantity: newStock,
            price: price
        };
        
        await logActivity(
            req.user,
            ACTION_TYPES.ADJUST_STOCK,
            ENTITY_TYPES.PRODUCT,
            id,
            createDescription(ACTION_TYPES.ADJUST_STOCK, ENTITY_TYPES.PRODUCT, id, `Product: ${product.name}, Stock adjusted by ${restock_quantity}`),
            beforeData,
            afterData
        );
    }

    res.status(200).json({ message: `Product ${id} updated with new stock and price.` });
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

    // Log activity for admin/staff users
    if (req.user) {
        const beforeData = sanitizeDataForLogging(currentProduct);
        
        await logActivity(
            req.user,
            ACTION_TYPES.DELETE_PRODUCT,
            ENTITY_TYPES.PRODUCT,
            req.params.id,
            createDescription(ACTION_TYPES.DELETE_PRODUCT, ENTITY_TYPES.PRODUCT, req.params.id, `Product: ${currentProduct.name}`),
            beforeData,
            null // no after data for deletion
        );
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
