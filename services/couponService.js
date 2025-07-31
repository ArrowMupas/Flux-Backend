const couponModel = require('../models/couponModel');
const HttpError = require('../helpers/errorHelper');

const formatDateTime = (input) => {
    if (!input) {
        return null;
    }
    const date = new Date(input);
    if (isNaN(date)) {
        throw new HttpError(400, 'Invalid datetime format');
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const createCoupon = async (data) => {
    const {
        code,
        description,
        discount_type,
        discount_value,
        is_active = true,
        starts_at,
        expires_at,
        usage_limit,
        per_user_limit,
    } = data;

    if (!code || !discount_type || !discount_value) {
        throw new HttpError(400, 'Required fields: code, discount_type, discount_value');
    }

    // Check for existing code
    const existing = await couponModel.getCouponByCode(code);
    if (existing) {
        throw new HttpError(409, 'Coupon code already exists');
    }

    const newCouponId = await couponModel.insertCoupon({
        code,
        description,
        discount_type,
        discount_value,
        is_active,
        starts_at: formatDateTime(starts_at),
        expires_at: formatDateTime(expires_at),
        usage_limit,
        per_user_limit,
    });

    return await couponModel.getCouponById(newCouponId);
};

module.exports = {
    createCoupon,
};
