const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/authMiddleware'); // Add auth middleware

router.get('/status/:status', verifyToken, orderController.getOrderByStatus);
router.post('/', verifyToken, orderController.createOrder);

module.exports = router;
