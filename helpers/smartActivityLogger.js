const adminActivityLogModel = require('../models/adminActivityLogModel');

const isAdminOrStaff = (user) => {
    const role = user.role || user.role_name;
    return role === 'admin' || role === 'staff';
};

const sanitizeData = (data, type = 'general') => {
    if (!data) return null;
    
    const sensitiveFields = {
        general: ['password', 'password_hash', 'token', 'secret'],
        user: ['password', 'password_hash', 'token', 'secret', 'reset_token'],
        product: [],
        order: ['payment_token', 'card_number', 'cvv']
    };
    
    const fieldsToRemove = sensitiveFields[type] || sensitiveFields.general;
    const sanitized = { ...data };
    
    fieldsToRemove.forEach(field => {
        if (sanitized[field]) {
            delete sanitized[field];
        }
    });
    
    return sanitized;
};

const generateDescription = (actionType, entityType, entityId, entityName, details = '') => {
    const actionMap = {
        ADD_PRODUCT: 'Added product',
        UPDATE_PRODUCT: 'Updated product', 
        DELETE_PRODUCT: 'Deleted product',
        ADJUST_STOCK: 'Adjusted stock for product',
        UPDATE_PRODUCT_PRICE: 'Updated price for product',
        ACTIVATE_PRODUCT: 'Activated product',
        DEACTIVATE_PRODUCT: 'Deactivated product',
        
        CREATE_USER: 'Created user',
        UPDATE_USER: 'Updated user',
        DELETE_USER: 'Deleted user',
        ACTIVATE_USER: 'Activated user',
        DEACTIVATE_USER: 'Deactivated user',
        CHANGE_USER_ROLE: 'Changed role for user',
        
        UPDATE_ORDER_STATUS: 'Updated order status',
        CANCEL_ORDER: 'Cancelled order',
        REFUND_ORDER: 'Refunded order',
        
        CREATE_COUPON: 'Created coupon',
        UPDATE_COUPON: 'Updated coupon',
        DELETE_COUPON: 'Deleted coupon'
    };
    
    const action = actionMap[actionType] || actionType.toLowerCase().replace('_', ' ');
    const name = entityName ? ` (${entityName})` : '';
    const extra = details ? ` - ${details}` : '';
    
    return `${action} ${entityId}${name}${extra}`;
};

const logProductAction = async ({ 
    req, 
    actionType, 
    productId, 
    productName = null, 
    before = null, 
    after = null,
    details = '' 
}) => {
    try {
        if (!req.user || !isAdminOrStaff(req.user)) return;
        
        const description = generateDescription(actionType, 'product', productId, productName, details);
        const sanitizedBefore = sanitizeData(before, 'product');
        const sanitizedAfter = sanitizeData(after, 'product');
        
        await adminActivityLogModel.logAdminActivity(
            req.user.id,
            req.user.username,
            req.user.role || req.user.role_name,
            actionType,
            'product',
            productId,
            description,
            sanitizedBefore,
            sanitizedAfter
        );
    } catch (error) {
        console.error('❌ Error logging product activity:', error);
    }
};

const logUserAction = async ({ 
    req, 
    actionType, 
    userId, 
    username = null, 
    before = null, 
    after = null,
    details = '' 
}) => {
    try {
        if (!req.user || !isAdminOrStaff(req.user)) return;
        
        const description = generateDescription(actionType, 'user', userId, username, details);
        const sanitizedBefore = sanitizeData(before, 'user');
        const sanitizedAfter = sanitizeData(after, 'user');
        
        await adminActivityLogModel.logAdminActivity(
            req.user.id,
            req.user.username,
            req.user.role || req.user.role_name,
            actionType,
            'user',
            userId,
            description,
            sanitizedBefore,
            sanitizedAfter
        );
    } catch (error) {
        console.error('❌ Error logging user activity:', error);
    }
};

const logOrderAction = async ({ 
    req, 
    actionType, 
    orderId, 
    before = null, 
    after = null,
    details = '' 
}) => {
    try {
        if (!req.user || !isAdminOrStaff(req.user)) return;
        
        const description = generateDescription(actionType, 'order', orderId, null, details);
        const sanitizedBefore = sanitizeData(before, 'order');
        const sanitizedAfter = sanitizeData(after, 'order');
        
        await adminActivityLogModel.logAdminActivity(
            req.user.id,
            req.user.username,
            req.user.role || req.user.role_name,
            actionType,
            'order',
            orderId,
            description,
            sanitizedBefore,
            sanitizedAfter
        );
    } catch (error) {
        console.error('❌ Error logging order activity:', error);
    }
};

const logCouponAction = async ({ 
    req, 
    actionType, 
    couponId, 
    couponCode = null, 
    before = null, 
    after = null,
    details = '' 
}) => {
    try {
        if (!req.user || !isAdminOrStaff(req.user)) return;
        
        const description = generateDescription(actionType, 'coupon', couponId, couponCode, details);
        const sanitizedBefore = sanitizeData(before);
        const sanitizedAfter = sanitizeData(after);
        
        await adminActivityLogModel.logAdminActivity(
            req.user.id,
            req.user.username,
            req.user.role || req.user.role_name,
            actionType,
            'coupon',
            couponId,
            description,
            sanitizedBefore,
            sanitizedAfter
        );
    } catch (error) {
        console.error('❌ Error logging coupon activity:', error);
    }
};

module.exports = {
    logProductAction,
    logUserAction,
    logOrderAction,
    logCouponAction
};
