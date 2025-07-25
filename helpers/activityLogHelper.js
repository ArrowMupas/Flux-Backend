const adminActivityLogModel = require('../models/adminActivityLogModel');

const logActivity = async (user, actionType, entityType, entityId, description, beforeData = null, afterData = null) => {
    try {
        const userRole = user.role || user.role_name;
        if (userRole === 'admin' || userRole === 'staff') {
            await adminActivityLogModel.logAdminActivity(
                user.id,
                user.username,
                userRole,
                actionType,
                entityType,
                entityId,
                description,
                beforeData,
                afterData
            );
        }
    } catch (error) {
        console.error('❌ Error logging admin activity:', error);
    }
};

const ACTION_TYPES = {
    ADD_PRODUCT: 'ADD_PRODUCT',
    UPDATE_PRODUCT: 'UPDATE_PRODUCT',
    DELETE_PRODUCT: 'DELETE_PRODUCT',
    ADJUST_STOCK: 'ADJUST_STOCK',
    UPDATE_PRODUCT_PRICE: 'UPDATE_PRODUCT_PRICE',
    ACTIVATE_PRODUCT: 'ACTIVATE_PRODUCT',
    DEACTIVATE_PRODUCT: 'DEACTIVATE_PRODUCT',
    
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',
    ACTIVATE_USER: 'ACTIVATE_USER',
    DEACTIVATE_USER: 'DEACTIVATE_USER',
    CHANGE_USER_ROLE: 'CHANGE_USER_ROLE',
    
    UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
    CANCEL_ORDER: 'CANCEL_ORDER',
    REFUND_ORDER: 'REFUND_ORDER',
    
    CREATE_COUPON: 'CREATE_COUPON',
    UPDATE_COUPON: 'UPDATE_COUPON',
    DELETE_COUPON: 'DELETE_COUPON',
    ACTIVATE_COUPON: 'ACTIVATE_COUPON',
    DEACTIVATE_COUPON: 'DEACTIVATE_COUPON',
    
    CREATE_BUNDLE: 'CREATE_BUNDLE',
    UPDATE_BUNDLE: 'UPDATE_BUNDLE',
    DELETE_BUNDLE: 'DELETE_BUNDLE',
    
    CREATE_SPECIAL_OFFER: 'CREATE_SPECIAL_OFFER',
    UPDATE_SPECIAL_OFFER: 'UPDATE_SPECIAL_OFFER',
    DELETE_SPECIAL_OFFER: 'DELETE_SPECIAL_OFFER',
    
    SYSTEM_CONFIGURATION: 'SYSTEM_CONFIGURATION',
    BACKUP_DATABASE: 'BACKUP_DATABASE',
    RESTORE_DATABASE: 'RESTORE_DATABASE'
};

const ENTITY_TYPES = {
    PRODUCT: 'product',
    USER: 'user',
    ORDER: 'order',
    COUPON: 'coupon',
    BUNDLE: 'bundle',
    SPECIAL_OFFER: 'special_offer',
    SYSTEM: 'system'
};

// Helper function to create standardized descriptions
const createDescription = (actionType, entityType, entityId, additionalInfo = '') => {
    const actionMap = {
        [ACTION_TYPES.ADD_PRODUCT]: `Added new product`,
        [ACTION_TYPES.UPDATE_PRODUCT]: `Updated product details`,
        [ACTION_TYPES.DELETE_PRODUCT]: `Deleted product`,
        [ACTION_TYPES.ADJUST_STOCK]: `Adjusted stock quantity`,
        [ACTION_TYPES.UPDATE_PRODUCT_PRICE]: `Updated product price`,
        [ACTION_TYPES.ACTIVATE_PRODUCT]: `Activated product`,
        [ACTION_TYPES.DEACTIVATE_PRODUCT]: `Deactivated product`,
        [ACTION_TYPES.CREATE_USER]: `Created new user`,
        [ACTION_TYPES.UPDATE_USER]: `Updated user information`,
        [ACTION_TYPES.DELETE_USER]: `Deleted user`,
        [ACTION_TYPES.ACTIVATE_USER]: `Activated user`,
        [ACTION_TYPES.DEACTIVATE_USER]: `Deactivated user`,
        [ACTION_TYPES.CHANGE_USER_ROLE]: `Changed user role`,
        [ACTION_TYPES.UPDATE_ORDER_STATUS]: `Updated order status`,
        [ACTION_TYPES.CANCEL_ORDER]: `Cancelled order`,
        [ACTION_TYPES.REFUND_ORDER]: `Processed order refund`,
        [ACTION_TYPES.CREATE_COUPON]: `Created new coupon`,
        [ACTION_TYPES.UPDATE_COUPON]: `Updated coupon`,
        [ACTION_TYPES.DELETE_COUPON]: `Deleted coupon`,
        [ACTION_TYPES.ACTIVATE_COUPON]: `Activated coupon`,
        [ACTION_TYPES.DEACTIVATE_COUPON]: `Deactivated coupon`,
        [ACTION_TYPES.CREATE_BUNDLE]: `Created new bundle`,
        [ACTION_TYPES.UPDATE_BUNDLE]: `Updated bundle`,
        [ACTION_TYPES.DELETE_BUNDLE]: `Deleted bundle`,
        [ACTION_TYPES.CREATE_SPECIAL_OFFER]: `Created new special offer`,
        [ACTION_TYPES.UPDATE_SPECIAL_OFFER]: `Updated special offer`,
        [ACTION_TYPES.DELETE_SPECIAL_OFFER]: `Deleted special offer`,
        [ACTION_TYPES.SYSTEM_CONFIGURATION]: `Modified system configuration`,
        [ACTION_TYPES.BACKUP_DATABASE]: `Performed database backup`,
        [ACTION_TYPES.RESTORE_DATABASE]: `Restored database`
    };

    const baseDescription = actionMap[actionType] || `Performed ${actionType}`;
    const entityInfo = entityId ? ` (ID: ${entityId})` : '';
    const additional = additionalInfo ? ` - ${additionalInfo}` : '';
    
    return `${baseDescription}${entityInfo}${additional}`;
};

// Helper function to sanitize data for logging (remove sensitive information)
const sanitizeDataForLogging = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
};

module.exports = {
    logActivity,
    ACTION_TYPES,
    ENTITY_TYPES,
    createDescription,
    sanitizeDataForLogging
};
