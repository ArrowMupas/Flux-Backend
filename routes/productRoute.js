const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validate = require('../middlewares/validateMiddleware');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const adminLogMiddleware = require('../middlewares/adminLogMiddleware');
const { ACTION_TYPES, ENTITY_TYPES } = require('../constants/adminActivityTypes');
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
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: ACTION_TYPES.CREATE,
    }),
    productController.createProduct
);

router.put(
    '/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    validate(updateProductSchema),
    autoStockCheckMiddleware({ checkProducts: true, checkBundles: true }),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: ACTION_TYPES.UPDATE,
    }),
    productController.updateProduct
);

router.patch(
    '/stock-price/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    validate(restockSchema),
    autoStockCheckMiddleware({ checkProducts: true, checkBundles: true }),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: ACTION_TYPES.ADJUST_STOCK,
    }),
    productController.updateProductStockAndPrice
);

router.patch(
    '/toggle-status/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    validate(statusSchema),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: (req, res) =>
            req.body.is_active ? ACTION_TYPES.ACTIVATE_PRODUCT : ACTION_TYPES.DEACTIVATE_PRODUCT,
    }),
    productController.updateProductActiveStatus
);

router.delete(
    '/:id',
    verifyToken,
    authorizeAccess([ROLES.ADMIN, ROLES.STAFF]),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: ACTION_TYPES.DELETE,
    }),
    productController.deleteProduct
);

router.get('/:id', productController.getProductById);

module.exports = router;
