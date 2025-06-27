const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validate = require('../middlewares/validateMiddleware');
const {
    productSchema,
    updateProductSchema,
    statusSchema,
    restockSchema,
} = require('../validations/productValidation');

router.get('/', productController.getAllProducts);
router.get('/admin/', productController.getAllProductsAdmin);
router.get('/:id', productController.getProductById);
router.post('/', validate(productSchema), productController.createProduct);
router.put('/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch(
    '/toggle-status/:id',
    validate(statusSchema),
    productController.updateProductActiveStatus
);
router.patch(
    '/stock-price/:id',
    validate(restockSchema),
    productController.updateProductStockAndPrice
);

module.exports = router;
