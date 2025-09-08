const inventoryNotificationModel = require('../models/inventoryNotificationModel');
const sendResponse = require('../middlewares/responseMiddleware');
const asyncHandler = require('express-async-handler');
const HttpError = require('../helpers/errorHelper');

const getAllInventoryNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const filters = {
        type: req.query.type,
        entity_type: req.query.entity_type,
        entity_id: req.query.entity_id,
        priority: req.query.priority,
        status: req.query.status,
        dateFrom: req.query.date_from,
        dateTo: req.query.date_to,
    };

    Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
            delete filters[key];
        }
    });

    const result = await inventoryNotificationModel.getAllInventoryNotifications(page, limit, filters);

    sendResponse(res, 200, 'Inventory notifications retrieved successfully', result);
});

const getNotificationsByEntity = asyncHandler(async (req, res) => {
    const { entity_type, entity_id } = req.params;
    const status = req.query.status;

    if (!['product', 'bundle'].includes(entity_type)) {
        throw new HttpError(400, 'Invalid entity type. Must be "product" or "bundle"');
    }

    const notifications = await inventoryNotificationModel.getNotificationsByEntity(entity_type, entity_id, status);

    sendResponse(res, 200, `Notifications for ${entity_type} ${entity_id} retrieved successfully`, notifications);
});

const getCriticalNotifications = asyncHandler(async (req, res) => {
    const notifications = await inventoryNotificationModel.getCriticalNotifications();

    sendResponse(res, 200, 'Critical notifications retrieved successfully', notifications);
});

const getNotificationSummary = asyncHandler(async (req, res) => {
    const dateFrom = req.query.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = req.query.date_to || new Date().toISOString();

    const summary = await inventoryNotificationModel.getNotificationSummary(dateFrom, dateTo);

    sendResponse(res, 200, 'Notification summary retrieved successfully', summary);
});

const getNotificationCounts = asyncHandler(async (req, res) => {
    const counts = await inventoryNotificationModel.getNotificationCounts();

    sendResponse(res, 200, 'Notification counts retrieved successfully', counts);
});

const acknowledgeNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const acknowledgedBy = req.user?.id || null;

    await inventoryNotificationModel.acknowledgeNotification(notificationId, acknowledgedBy);

    sendResponse(res, 200, 'Notification acknowledged successfully');
});

const resolveNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const resolvedBy = req.user?.id || null;

    const affectedRows = await inventoryNotificationModel.resolveNotification(notificationId, resolvedBy);

    if (affectedRows === 0) {
        throw new HttpError(404, 'Notification not found or already resolved');
    }

    sendResponse(res, 200, 'Notification resolved successfully', { affectedRows });
});

const resolveNotifications = asyncHandler(async (req, res) => {
    const { entity_type, entity_id } = req.params;
    const resolvedBy = req.user?.id || null;

    if (!['product', 'bundle'].includes(entity_type)) {
        throw new HttpError(400, 'Invalid entity type. Must be "product" or "bundle"');
    }

    const affectedRows = await inventoryNotificationModel.resolveNotifications(entity_type, entity_id, resolvedBy);

    if (affectedRows === 0) {
        sendResponse(res, 200, `No active notifications found for ${entity_type} ${entity_id}`, { affectedRows });
    } else {
        sendResponse(res, 200, `${affectedRows} notifications resolved for ${entity_type} ${entity_id}`, {
            affectedRows,
        });
    }
});

const cleanupOldNotifications = asyncHandler(async (req, res) => {
    const daysOld = parseInt(req.query.days_old) || 30;

    const deletedCount = await inventoryNotificationModel.cleanupOldNotifications(daysOld);

    sendResponse(res, 200, `Cleanup completed. ${deletedCount} old notifications removed`);
});

const triggerStockCheck = asyncHandler(async (req, res) => {
    const { entity_type, entity_id } = req.params;
    const smartInventoryNotifier = require('../helpers/smartInventoryNotifier');

    if (!['product', 'bundle'].includes(entity_type)) {
        throw new HttpError(400, 'Invalid entity type. Must be "product" or "bundle"');
    }

    try {
        if (entity_type === 'product') {
            const productModel = require('../models/productModel');
            const product = await productModel.getProductById(entity_id);

            if (!product) {
                throw new HttpError(404, 'Product not found');
            }

            await smartInventoryNotifier.checkProductStock(product);
        }

        sendResponse(res, 200, `Stock check triggered for ${entity_type} ${entity_id}`);
    } catch (error) {
        console.error('Error in manual stock check:', error);
        throw new HttpError(500, `Failed to trigger stock check: ${error.message}`);
    }
});

const triggerBatchStockCheck = asyncHandler(async (req, res) => {
    const smartInventoryNotifier = require('../helpers/smartInventoryNotifier');
    const productModel = require('../models/productModel');

    try {
        const products = await productModel.getAllProducts();
        await smartInventoryNotifier.checkMultipleProducts(products);

        sendResponse(res, 200, 'Batch stock check completed for all products and bundles');
    } catch (error) {
        console.error('Error in batch stock check:', error);
        throw new HttpError(500, `Failed to complete batch stock check: ${error.message}`);
    }
});

module.exports = {
    getAllInventoryNotifications,
    getNotificationsByEntity,
    getCriticalNotifications,
    getNotificationSummary,
    getNotificationCounts,
    acknowledgeNotification,
    resolveNotification,
    resolveNotifications,
    cleanupOldNotifications,
    triggerStockCheck,
    triggerBatchStockCheck,
};
