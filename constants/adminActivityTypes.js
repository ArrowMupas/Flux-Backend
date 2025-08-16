// Activity types for admin actions for logging and tracking purposes
// Types of Admin Actions
const ACTION_TYPES = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ACTIVATE_PRODUCT: 'ACTIVATE_PRODUCT',
    DEACTIVATE_PRODUCT: 'DEACTIVATE_PRODUCT',
    ADJUST_STOCK: 'ADJUST_STOCK',
};

// Entity types that can be affected by admin actions
const ENTITY_TYPES = {
    PRODUCT: 'PRODUCT',
    ORDER: 'ORDER',
    USER: 'USER',
};

module.exports = { ACTION_TYPES, ENTITY_TYPES };
