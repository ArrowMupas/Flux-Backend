const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const notificationModel = require('../models/notificationModel');

const getNotifications = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const notifications = await notificationModel.getUserNotifications(id);

    return sendResponse(res, 200, 'Notifications retrieved successfully', notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
    const { id: notificationId } = req.params;
    const { id: userId } = req.user;

    const updated = await notificationModel.markAsRead(notificationId, userId);

    if (!updated) {
        return sendResponse(res, 404, 'Notification not found or unauthorized');
    }

    return sendResponse(res, 200, 'Notification marked as read');
});

module.exports = {
    getNotifications,
    markAsRead,
};
