const couponModel = require('../models/couponModel');
const HttpError = require('../helpers/errorHelper');

/**
 * Validates a coupon and returns coupon details for frontend calculation
 * @param {string} couponCode - The coupon code to validate
 * @returns {object} - Coupon details if valid
 */
const validateCouponCode = async (couponCode) => {
    if (!couponCode) {
        throw new HttpError(400, 'Coupon code is required');
    }

    const coupon = await couponModel.findValidCoupon(couponCode);
    if (!coupon) {
        throw new HttpError(400, 'Invalid or expired coupon code');
    }

    return coupon; // Let frontend calculate the discount
};

/**
 * Applies a validated coupon during order creation (server-side verification)
 * @param {string} couponCode - The coupon code to apply
 * @param {number} cartTotal - The cart total amount
 * @returns {object} - Contains coupon info, discount amount, and final total
 */
const applyCouponToOrder = async (couponCode, cartTotal) => {
    if (!couponCode) {
        return {
            coupon: null,
            discount: 0,
            finalTotal: cartTotal
        };
    }

    // Re-validate coupon on server side for security
    const coupon = await couponModel.findValidCoupon(couponCode);
    if (!coupon) {
        throw new HttpError(400, 'Invalid or expired coupon code');
    }

    // Server-side calculation for final verification
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = (cartTotal * coupon.amount) / 100;
    } else if (coupon.type === 'FIXED') {
        discount = Math.min(coupon.amount, cartTotal);
    }

    const finalTotal = Math.max(0, cartTotal - discount);
    
    return {
        coupon,
        discount,
        finalTotal
    };
};

/**
 * Validates a coupon without applying it (alias for backward compatibility)
 * @param {string} couponCode - The coupon code to validate
 * @returns {object} - Coupon details if valid
 */
const validateCoupon = async (couponCode) => {
    return await validateCouponCode(couponCode);
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
    validateCouponCode,
    applyCouponToOrder,
    validateCoupon, // For backward compatibility
    storeCouponForUser,
    getStoredCouponForUser
};
