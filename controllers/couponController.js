const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const HttpError = require('../helpers/errorHelper');
const couponModel = require('../models/couponModel');
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

module.exports = {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    applyCouponByCode,
};
