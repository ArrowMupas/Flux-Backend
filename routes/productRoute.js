const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validate = require('../middlewares/validateMiddleware');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const {
    productSchema,
    updateProductSchema,
    statusSchema,
    restockSchema,
} = require('../validations/productValidation');
const ROLES = require('../constants/roles');
const { autoStockCheckMiddleware } = require('../middlewares/autoStockCheckMiddleware');

// Public Routes
router.get('/', productController.getAllProducts);

// Protected routes
router.get(
    '/admin/',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    productController.getAllProductsAdmin
);

router.post(
    '/',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    validate(productSchema),
    productController.createProduct
);

router.put(
    '/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    validate(updateProductSchema),
    autoStockCheckMiddleware({ checkProducts: true, checkBundles: true }),
    productController.updateProduct
);

router.patch(
    '/stock-price/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    validate(restockSchema),
    autoStockCheckMiddleware({ checkProducts: true, checkBundles: true }),
    productController.updateProductStockAndPrice
);

router.patch(
    '/toggle-status/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    validate(statusSchema),
    productController.updateProductActiveStatus
);

router.delete(
    '/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    productController.deleteProduct
);

router.get('/:id', productController.getProductById);

module.exports = router;
