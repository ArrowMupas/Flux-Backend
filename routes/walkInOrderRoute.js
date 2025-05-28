const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const walkInOrderController = require('../controllers/walkInOrderController');

router.post('/', walkInOrderController.createWalkInSale);
router.get('/', walkInOrderController.getAllWalkInOrders);

module.exports = router;
