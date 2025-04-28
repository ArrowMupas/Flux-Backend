const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/authMiddleware'); // Add auth middleware

// Corrected route (POST /api/orders)
router.post('/', verifyToken, orderController.checkoutFromCart);

module.exports = router;