const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const HttpError = require('../helpers/errorHelper');
const couponModel = require('../models/couponModel');
const couponService = require('../services/couponService');
const cartModel = require('../models/cartModel');
const { couponSchema } = require('../validations/couponValidation');

const getAllCoupons = asyncHandler(async (req, res) => {
    const coupons = await couponModel.getAllCoupons();
    return sendResponse(res, 200, 'Coupons fetched.', coupons);
});

const createCoupon = asyncHandler(async (req, res) => {
    const { error, value } = couponSchema.validate(req.body);
    if (error) throw new HttpError(400, error.details[0].message);

    await couponModel.createCoupon(value);
    return sendResponse(res, 201, 'Coupon created.');
});

const updateCoupon = asyncHandler(async (req, res) => {
    const { error, value } = couponSchema.validate(req.body);
    if (error) throw new HttpError(400, error.details[0].message);

    await couponModel.updateCoupon(req.params.id, value);
    return sendResponse(res, 200, 'Coupon updated.');
});

const deleteCoupon = asyncHandler(async (req, res) => {
    await couponModel.deleteCoupon(req.params.id);
    return sendResponse(res, 200, 'Coupon deleted.');
});

const applyCouponByCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const coupon = await couponModel.findValidCoupon(code);

    if (!coupon) throw new HttpError(404, 'Invalid or expired coupon');

    return sendResponse(res, 200, 'Coupon applied.', coupon);
});

const validateCouponForCart = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.user?.id || req.body.userId;
    
    if (!userId) {
        throw new HttpError(400, 'User ID is required');
    }
    
    if (!couponCode) {
        throw new HttpError(400, 'Coupon code is required');
    }
    
    // Get cart total for reference
    const cart = await cartModel.getCartItemsByUserId(userId);
    if (!cart.items || cart.items.length === 0) {
        throw new HttpError(404, 'Cart is empty');
    }
    
    // Only validate coupon - let frontend calculate discount
    const coupon = await couponService.validateCouponCode(couponCode);
    
    const response = {
        items: cart.items,
        cartTotal: parseFloat(cart.cart_total) || 0,
        validCoupon: coupon
        // Frontend will calculate: discount and estimatedTotal
    };
    
    return sendResponse(res, 200, 'Coupon validated successfully.', response);
});

const removeCouponFromCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId;
    
    // Get cart without coupon
    const cart = await cartModel.getCartItemsByUserId(userId);
    
    return sendResponse(res, 200, 'Coupon removed successfully.', {
        originalTotal: cart.cart_total,
        discount: 0,
        finalTotal: cart.cart_total,
        coupon: null,
        items: cart.items
    });
});

module.exports = {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    applyCouponByCode,
    validateCouponForCart,
    removeCouponFromCart,
};
