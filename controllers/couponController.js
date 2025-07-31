const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const couponService = require('../services/couponService.js');

const createCoupon = asyncHandler(async (req, res) => {
    const result = await couponService.createCoupon(req.body);
    return sendResponse(res, 201, 'Coupon created successfully', result);
});

module.exports = {
    createCoupon,
};
