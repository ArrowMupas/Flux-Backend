const adminActivityLogModel = require('../models/adminActivityLogModel');
const sendResponse = require('../middlewares/responseMiddleware');
const asyncHandler = require('express-async-handler');
const HttpError = require('../helpers/errorHelper');

const getAllAdminActivityLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const filters = {
        userId: req.query.user_id,
        role: req.query.role,
        actionType: req.query.action_type,
        entityType: req.query.entity_type,
        dateFrom: req.query.date_from,
        dateTo: req.query.date_to
    };

    Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
            delete filters[key];
        }
    });

    const result = await adminActivityLogModel.getAllAdminActivityLogs(page, limit, filters);
    
    sendResponse(res, 200, 'Admin activity logs retrieved successfully', result);
});

const getAdminActivityLogsByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const logs = await adminActivityLogModel.getAdminActivityLogsByUserId(userId, page, limit);
    
    sendResponse(res, 200, 'User activity logs retrieved successfully', logs);
});

const getAdminActivityLogsByEntity = asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;

    const logs = await adminActivityLogModel.getAdminActivityLogsByEntity(entityType, entityId);
    
    sendResponse(res, 200, 'Entity activity logs retrieved successfully', logs);
});

const getActivitySummary = asyncHandler(async (req, res) => {
    const dateFrom = req.query.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = req.query.date_to || new Date().toISOString();

    const summary = await adminActivityLogModel.getActivitySummary(dateFrom, dateTo);
    
    sendResponse(res, 200, 'Activity summary retrieved successfully', summary);
});

module.exports = {
    getAllAdminActivityLogs,
    getAdminActivityLogsByUserId,
    getAdminActivityLogsByEntity,
    getActivitySummary
};
