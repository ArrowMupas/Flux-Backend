const express = require('express');
const router = express.Router({ strict: true });
const validate = require('../middlewares/validateMiddleware');
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const adminLogMiddleware = require('../middlewares/adminLogMiddleware');
const { ACTION_TYPES, ENTITY_TYPES } = require('../constants/adminActivityTypes');
const { productSchema, updateProductSchema, statusSchema, restockSchema } = require('../validations/productValidation');
const ROLES = require('../constants/roles');
const { autoStockCheckMiddleware } = require('../middlewares/autoStockCheckMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const productController = require('../controllers/productController');
const {
    getAllProducts,
    getAllProductsAdmin,
    createProduct,
    updateProduct,
    // updateProductStockAndPrice,
    updateProductActiveStatus,
    deleteProduct,
    getProductById,
} = require('../controllers/productController');

router.use(generalLimiter);

// Public Routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes
router.use(verifyToken);
router.use(authorizeAccess([ROLES.ADMIN, ROLES.STAFF]));

router.get('/admin/list', getAllProductsAdmin);

router.post(
    '/',
    validate(productSchema),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: ACTION_TYPES.CREATE,
    }),
    createProduct
);

router.put(
    '/:id',
    validate(updateProductSchema),
    autoStockCheckMiddleware({ checkProducts: true, checkBundles: true }),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: ACTION_TYPES.UPDATE,
    }),
    updateProduct
);

router.patch(
    '/stock-price/:id',
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
    validate(statusSchema),
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: (req, res) =>
            req.body.is_active ? ACTION_TYPES.ACTIVATE_PRODUCT : ACTION_TYPES.DEACTIVATE_PRODUCT,
    }),
    updateProductActiveStatus
);

router.delete(
    '/:id',
    adminLogMiddleware({
        entity_type: ENTITY_TYPES.PRODUCT,
        action_type: ACTION_TYPES.DELETE,
    }),
    deleteProduct
);

module.exports = router;
