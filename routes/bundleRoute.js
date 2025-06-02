const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundleController');

// Admin routes
router.get('/', bundleController.getAllBundles);
router.post('/', bundleController.createBundle);
router.put('/:id', bundleController.updateBundle);
router.delete('/:id', bundleController.deleteBundle);

// Public
router.get('/:id', bundleController.getBundleById);

module.exports = router;
