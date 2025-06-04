const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProduct, validateProductUpdate } = require('../validations/productValidation');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', validateProduct, productController.createProduct);
router.put('/:id', validateProductUpdate, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/toggle-status/:id', productController.updateProductActiveStatus);
router.patch('/stock-price/:id', productController.updateProductStockAndPrice);

module.exports = router;
