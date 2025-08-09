const inventoryNotificationModel = require('../models/inventoryNotificationModel');

const STOCK_THRESHOLDS = {
    LOW_STOCK: 10,
    CRITICAL_STOCK: 5,
    OUT_OF_STOCK: 0
};

const NOTIFICATION_TYPES = {
    LOW_STOCK: 'LOW_STOCK',
    CRITICAL_STOCK: 'CRITICAL_STOCK',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    BUNDLE_LOW_STOCK: 'BUNDLE_LOW_STOCK',
    BUNDLE_UNAVAILABLE: 'BUNDLE_UNAVAILABLE'
};

const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

const determineStockLevel = (quantity) => {
    if (quantity <= STOCK_THRESHOLDS.OUT_OF_STOCK) {
        return NOTIFICATION_TYPES.OUT_OF_STOCK;
    } else if (quantity <= STOCK_THRESHOLDS.CRITICAL_STOCK) {
        return NOTIFICATION_TYPES.CRITICAL_STOCK;
    } else if (quantity <= STOCK_THRESHOLDS.LOW_STOCK) {
        return NOTIFICATION_TYPES.LOW_STOCK;
    }
    return null;
};

const generateNotificationMessage = (type, entityType, entityData) => {
    const messages = {
        [NOTIFICATION_TYPES.OUT_OF_STOCK]: {
            product: `Product "${entityData.name}" (${entityData.id}) is out of stock`,
            bundle: `Bundle "${entityData.name}" is unavailable due to out-of-stock items`
        },
        [NOTIFICATION_TYPES.CRITICAL_STOCK]: {
            product: `Product "${entityData.name}" (${entityData.id}) has critical stock level: ${entityData.stock_quantity} remaining`,
            bundle: `Bundle "${entityData.name}" has critical stock levels in component products`
        },
        [NOTIFICATION_TYPES.LOW_STOCK]: {
            product: `Product "${entityData.name}" (${entityData.id}) has low stock: ${entityData.stock_quantity} remaining`,
            bundle: `Bundle "${entityData.name}" has low stock in component products`
        },
        [NOTIFICATION_TYPES.BUNDLE_LOW_STOCK]: {
            bundle: `Bundle "${entityData.name}" has low stock in component products`
        },
        [NOTIFICATION_TYPES.BUNDLE_UNAVAILABLE]: {
            bundle: `Bundle "${entityData.name}" is unavailable due to insufficient stock`
        }
    };
    
    return messages[type]?.[entityType] || `${type} notification for ${entityType} ${entityData.id || entityData.name}`;
};

const determinePriority = (type) => {
    const priorityMap = {
        [NOTIFICATION_TYPES.OUT_OF_STOCK]: PRIORITY_LEVELS.CRITICAL,
        [NOTIFICATION_TYPES.CRITICAL_STOCK]: PRIORITY_LEVELS.HIGH,
        [NOTIFICATION_TYPES.LOW_STOCK]: PRIORITY_LEVELS.MEDIUM,
        [NOTIFICATION_TYPES.BUNDLE_LOW_STOCK]: PRIORITY_LEVELS.MEDIUM,
        [NOTIFICATION_TYPES.BUNDLE_UNAVAILABLE]: PRIORITY_LEVELS.HIGH
    };
    
    return priorityMap[type] || PRIORITY_LEVELS.LOW;
};


const checkProductStock = async (productData) => {
    try {
        const { id, name, stock_quantity } = productData;
        const stockLevel = determineStockLevel(stock_quantity);
        
        if (!stockLevel) return; 
        
        const message = generateNotificationMessage(stockLevel, 'product', productData);
        const priority = determinePriority(stockLevel);
        
        const existingNotification = await inventoryNotificationModel.getRecentNotification(
            'product', 
            id, 
            stockLevel
        );
        
        if (existingNotification) {
            await inventoryNotificationModel.updateNotificationTimestamp(existingNotification.id);
            return;
        }
        
        await inventoryNotificationModel.createInventoryNotification({
            type: stockLevel,
            entity_type: 'product',
            entity_id: id,
            message,
            priority,
            metadata: {
                product_name: name,
                current_stock: stock_quantity,
                threshold_triggered: stockLevel,
                checked_at: new Date().toISOString()
            }
        });
        
        console.log(` Stock notification logged: ${message}`);
    } catch (error) {
        console.error(' Error checking product stock:', error);
    }
};


const checkBundleStock = async (bundleData, bundleItems) => {
    try {
        const { bundle_id, name } = bundleData;
        let hasLowStock = false;
        let hasOutOfStock = false;
        const problemItems = [];
        
        for (const item of bundleItems) {
            const availableStock = item.stock_quantity - item.reserved_quantity;
            const requiredQuantity = item.quantity;
            
            if (availableStock < requiredQuantity) {
                hasOutOfStock = true;
                problemItems.push({
                    product_name: item.product_name,
                    available: availableStock,
                    required: requiredQuantity
                });
            } else if (availableStock <= STOCK_THRESHOLDS.LOW_STOCK) {
                hasLowStock = true;
                problemItems.push({
                    product_name: item.product_name,
                    available: availableStock,
                    required: requiredQuantity
                });
            }
        }
        
        let notificationType = null;
        if (hasOutOfStock) {
            notificationType = NOTIFICATION_TYPES.BUNDLE_UNAVAILABLE;
        } else if (hasLowStock) {
            notificationType = NOTIFICATION_TYPES.BUNDLE_LOW_STOCK;
        }
        
        if (!notificationType) return; 
        
        const message = generateNotificationMessage(notificationType, 'bundle', bundleData);
        const priority = determinePriority(notificationType);
        
        const existingNotification = await inventoryNotificationModel.getRecentNotification(
            'bundle', 
            bundle_id.toString(), 
            notificationType
        );
        
        if (existingNotification) {
            await inventoryNotificationModel.updateNotificationTimestamp(existingNotification.id);
            return;
        }
        
        await inventoryNotificationModel.createInventoryNotification({
            type: notificationType,
            entity_type: 'bundle',
            entity_id: bundle_id.toString(),
            message,
            priority,
            metadata: {
                bundle_name: name,
                problem_items: problemItems,
                total_items_affected: problemItems.length,
                checked_at: new Date().toISOString()
            }
        });
        
        console.log(` Bundle notification logged: ${message}`);
    } catch (error) {
        console.error(' Error checking bundle stock:', error);
    }
};

const checkMultipleProducts = async (products) => {
    try {
        const checkPromises = products.map(product => checkProductStock(product));
        await Promise.all(checkPromises);
    } catch (error) {
        console.error(' Error in batch product check:', error);
    }
};

const checkMultipleBundles = async (bundlesWithItems) => {
    try {
        const checkPromises = bundlesWithItems.map(({ bundle, items }) => 
            checkBundleStock(bundle, items)
        );
        await Promise.all(checkPromises);
    } catch (error) {
        console.error(' Error in batch bundle check:', error);
    }
};

const resolveStockNotification = async (entityType, entityId, resolvedBy = null) => {
    try {
        await inventoryNotificationModel.resolveNotifications(entityType, entityId, resolvedBy);
        console.log(`✅ Stock notifications resolved for ${entityType} ${entityId}`);
    } catch (error) {
        console.error(' Error resolving stock notification:', error);
    }
};


const createCustomStockNotification = async ({ 
    type, 
    entityType, 
    entityId, 
    message, 
    priority = PRIORITY_LEVELS.MEDIUM, 
    metadata = {} 
}) => {
    try {
        await inventoryNotificationModel.createInventoryNotification({
            type,
            entity_type: entityType,
            entity_id: entityId,
            message,
            priority,
            metadata: {
                ...metadata,
                custom_notification: true,
                created_at: new Date().toISOString()
            }
        });
        
        console.log(` Custom notification created: ${message}`);
    } catch (error) {
        console.error(' Error creating custom notification:', error);
    }
};

module.exports = {
    checkProductStock,
    checkBundleStock,
    checkMultipleProducts,
    checkMultipleBundles,
    resolveStockNotification,
    createCustomStockNotification,
    STOCK_THRESHOLDS,
    NOTIFICATION_TYPES,
    PRIORITY_LEVELS
};
