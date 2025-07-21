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

router.get('/', productController.getAllProducts);
router.get('/admin/', verifyToken, authorizeAccess(['admin', 'staff']), productController.getAllProductsAdmin);
router.get('/:id', productController.getProductById);
router.post('/', verifyToken, authorizeAccess(['admin', 'staff']), validate(productSchema), productController.createProduct);
router.put('/:id', verifyToken, authorizeAccess(['admin', 'staff']), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', verifyToken, authorizeAccess(['admin', 'staff']), productController.deleteProduct);
router.patch(
    '/toggle-status/:id',
    verifyToken,
    authorizeAccess(['admin', 'staff']),
    validate(statusSchema),
    productController.updateProductActiveStatus
);
router.patch(
    '/stock-price/:id',
    verifyToken,
    authorizeAccess(['admin', 'staff']),
    validate(restockSchema),
    productController.updateProductStockAndPrice
);

module.exports = router;
