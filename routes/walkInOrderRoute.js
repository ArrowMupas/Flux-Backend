const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const walkInOrderController = require('../controllers/walkInOrderController');
const { validateWalkInOrder } = require('../validations/walkInOrderValidation');

router.post('/', validateWalkInOrder, walkInOrderController.createWalkInSale);
router.get('/', walkInOrderController.getAllWalkInOrders);

module.exports = router;
