const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// Admin routes
router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

// Public
router.get('/apply/:code', couponController.applyCouponByCode);
router.post('/validate', couponController.validateCouponForCart);
router.post('/remove', couponController.removeCouponFromCart);

module.exports = router;
