const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const notificationModel = require('../models/notificationModel');

const createNotification = asyncHandler(async (req, res) => {
    const data = req.body;
    await notificationModel.createNotification(data);
    return sendResponse(res, 201, 'Notification created.');
});

const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const notifications = await notificationModel.getNotificationsForUser(userId);
    return sendResponse(res, 200, 'Notifications fetched.', notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
    const id = req.params.notificationId;
    await notificationModel.markNotificationAsRead(id);
    return sendResponse(res, 200, 'Notification marked as read.');
});

const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    await notificationModel.markAllNotificationsAsRead(userId);
    return sendResponse(res, 200, 'All notifications marked as read.');
});

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
};
