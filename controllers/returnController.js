const asyncHandler = require('express-async-handler');
const returnService = require('../services/returnService');
const sendResponse = require('../middlewares/responseMiddleware');
const HttpError = require('../helpers/errorHelper');
const notificationModel = require('../models/notificationModel');

const getAllReturnRequests = asyncHandler(async (req, res) => {
    const requests = await returnService.getAllReturnRequests();

    return sendResponse(res, 200, 'Return requests retrieved successfully', requests);
});

const requestReturn = asyncHandler(async (req, res) => {
    const { reason, contact_number, image_url } = req.body;
    const { orderId } = req.params;
    const customerId = req.user.id;

    const returnRequest = await returnService.requestReturnLogic(
        orderId,
        customerId,
        reason,
        contact_number,
        image_url
    );

    return sendResponse(res, 200, 'Return Request Sent.', returnRequest);
});

const adminApproveReturn = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { orderId } = req.params;
    const io = req.app.get('io');

    const approvedReturn = await returnService.approveReturnLogic(orderId, notes);

    if (approvedReturn?.user_id) {
        await notificationModel.createNotification({
            user_id: approvedReturn.user_id,
            type: 'success',
            title: 'Order Returned',
            message: `Your order #${orderId} is now Returned.`,
            order_id: orderId,
        });

        io.to(`user_${approvedReturn.user_id}`).emit('order:update', {
            type: 'success',
            message: `Your order #${orderId} is now  returned`,
            orderId,
            newStatus: 'Returned',
        });
    }

    return sendResponse(res, 200, 'Return Request Approved', approvedReturn);
});

const adminDenyReturn = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { orderId } = req.params;
    const io = req.app.get('io');

    const declinedReturn = await returnService.denyReturnLogic(orderId, notes);

    if (declinedReturn?.user_id) {
        await notificationModel.createNotification({
            user_id: declinedReturn.user_id,
            type: 'error',
            title: 'Return denied',
            message: `Your return requerst for order #${orderId} is  denied.`,
            order_id: orderId,
        });

        io.to(`user_${declinedReturn.user_id}`).emit('order:update', {
            type: 'error',
            message: `Your return request for order #${orderId} is denied`,
            orderId,
            newStatus: 'Return Denied',
        });
    }

    return sendResponse(res, 200, 'Return Request Declined', declinedReturn);
});

module.exports = { getAllReturnRequests, requestReturn, adminApproveReturn, adminDenyReturn };
