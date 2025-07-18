const couponModel = require('../models/couponModel');
const HttpError = require('../helpers/errorHelper');

/**
 * Validates and applies a coupon to a cart total
 * @param {string} couponCode - The coupon code to apply
 * @param {number} cartTotal - The cart total amount
 * @returns {object} - Contains coupon info, discount amount, and final total
 */
const applyCouponToTotal = async (couponCode, cartTotal) => {
    console.log('applyCouponToTotal called with:', { couponCode, cartTotal });
    
    if (!couponCode) {
        return {
            coupon: null,
            discount: 0,
            finalTotal: cartTotal
        };
    }

    const coupon = await couponModel.findValidCoupon(couponCode);
    console.log('Found coupon:', JSON.stringify(coupon, null, 2));
    
    if (!coupon) {
        throw new HttpError(400, 'Invalid or expired coupon code');
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = (cartTotal * coupon.amount) / 100;
        console.log('Percentage discount calculation:', { cartTotal, amount: coupon.amount, discount });
    } else if (coupon.type === 'FIXED') {
        discount = Math.min(coupon.amount, cartTotal); // Don't exceed cart total
        console.log('Fixed discount calculation:', { amount: coupon.amount, cartTotal, discount });
    }

    const finalTotal = Math.max(0, cartTotal - discount); // Ensure non-negative
    
    const result = {
        coupon,
        discount,
        finalTotal
    };
    
    console.log('Final coupon result:', JSON.stringify(result, null, 2));
    
    return result;
};

/**
 * Validates a coupon without applying it
 * @param {string} couponCode - The coupon code to validate
 * @returns {object} - Coupon details if valid
 */
const validateCoupon = async (couponCode) => {
    if (!couponCode) {
        throw new HttpError(400, 'Coupon code is required');
    }

    const coupon = await couponModel.findValidCoupon(couponCode);
    if (!coupon) {
        throw new HttpError(400, 'Invalid or expired coupon code');
    }

    return coupon;
};

/**
 * Temporarily store coupon for user session (optional approach)
 * @param {string} couponCode - The coupon code to store
 * @param {number} cartTotal - The cart total amount
 * @param {number} userId - The user ID
 * @returns {object} - Contains coupon info and discount preview
 */
const storeCouponForUser = async (couponCode, cartTotal, userId) => {
    const couponResult = await applyCouponToTotal(couponCode, cartTotal);
    
    // Store in session/cache (you could use Redis, or simple in-memory store)
    // For now, we'll just return the result for frontend to manage
    return {
        userId,
        appliedCoupon: couponResult.coupon,
        discount: couponResult.discount,
        originalTotal: cartTotal,
        finalTotal: couponResult.finalTotal,
        timestamp: new Date().toISOString()
    };
};

/**
 * Get stored coupon for user
 * @param {number} userId - The user ID
 * @returns {object|null} - Stored coupon data or null
 */
const getStoredCouponForUser = async (userId) => {
    // Implementation would depend on your storage choice
    // This is a placeholder for the concept
    return null;
};

module.exports = {
    applyCouponToTotal,
    validateCoupon,
    storeCouponForUser,
    getStoredCouponForUser
};
