/**
 * Calculate discount amount and final total from coupon data
 * @param {Object} coupon - Coupon object from API
 * @param {number} cartTotal - Cart total amount
 * @returns {Object} - Contains discount and finalTotal
 */
const calculateCouponDiscount = (coupon, cartTotal) => {
    if (!coupon || cartTotal <= 0) {
        return {
            discount: 0,
            finalTotal: cartTotal
        };
    }

    let discount = 0;
    
    if (coupon.type === 'PERCENTAGE') {
        discount = (cartTotal * coupon.amount) / 100;
    } else if (coupon.type === 'FIXED') {
        discount = Math.min(coupon.amount, cartTotal); // Don't exceed cart total
    }

    const finalTotal = Math.max(0, cartTotal - discount); // Ensure non-negative
    
    return {
        discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
        finalTotal: Math.round(finalTotal * 100) / 100
    };
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ₱)
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount, currency = '₱') => {
    return `${currency} ${amount.toFixed(2)}`;
};

/**
 * Validate coupon and update cart display
 * @param {string} couponCode - Coupon code to validate
 * @param {number} cartTotal - Current cart total
 * @param {Function} updateUI - Function to update UI elements
 */
const applyCouponToCart = async (couponCode, cartTotal, updateUI) => {
    try {
        const response = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ couponCode })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            const { discount, finalTotal } = calculateCouponDiscount(
                data.data.validCoupon, 
                data.data.cartTotal
            );

            updateUI({
                cartTotal: data.data.cartTotal,
                discount,
                finalTotal,
                coupon: data.data.validCoupon,
                message: 'Coupon applied successfully!'
            });

            return { success: true, discount, finalTotal };
        } else {
            throw new Error(data.message || 'Invalid coupon code');
        }
    } catch (error) {
        updateUI({
            error: error.message,
            discount: 0,
            finalTotal: cartTotal,
            coupon: null
        });
        return { success: false, error: error.message };
    }
};

/**
 * Remove coupon from cart display
 * @param {number} cartTotal - Original cart total
 * @param {Function} updateUI - Function to update UI elements
 */
const removeCouponFromCart = (cartTotal, updateUI) => {
    updateUI({
        cartTotal,
        discount: 0,
        finalTotal: cartTotal,
        coupon: null,
        message: 'Coupon removed'
    });
};

// Export for use in your frontend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateCouponDiscount,
        formatCurrency,
        applyCouponToCart,
        removeCouponFromCart
    };
}

