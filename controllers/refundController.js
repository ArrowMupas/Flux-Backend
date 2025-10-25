const asyncHandler = require('express-async-handler');
const refundService = require('../services/refundService');
const sendResponse = require('../middlewares/responseMiddleware');
const notificationModel = require('../models/notificationModel');

const getAllRefundRequests = asyncHandler(async (req, res) => {
    const requests = await refundService.getAllRefundRequests();

    return sendResponse(res, 200, 'Refund requests retrieved successfully', requests);
});

const requestRefund = asyncHandler(async (req, res) => {
    const { reason, contact_number } = req.body;
    const { orderId } = req.params;
    const customerId = req.user.id;

    const refundRequest = await refundService.requestRefundLogic(orderId, customerId, reason, contact_number);

    return sendResponse(res, 200, 'Refund Request Sent.', refundRequest);
});

const adminApproveRefund = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { orderId } = req.params;
    const adminId = req.user.id;
    const io = req.app.get('io');

    const approvedRefund = await refundService.approveRefundLogic(orderId, notes, adminId);

    if (approvedRefund?.user_id) {
        await notificationModel.createNotification({
            user_id: approvedRefund.user_id,
            type: 'success',
            title: 'Order Refunded',
            message: `Your order #${orderId} is now Refunded.`,
            order_id: orderId,
        });

        io.to(`user_${approvedRefund.user_id}`).emit('order:update', {
            type: 'success',
            message: `Your order #${orderId} is now  refunded`,
            orderId,
            newStatus: 'Refunded',
        });
    }

    return sendResponse(res, 200, 'Refund Request Approved', approvedRefund);
});

const adminDenyRefund = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { orderId } = req.params;
    const adminId = req.user.id;
    const io = req.app.get('io');

    const declinedRefund = await refundService.denyRefundLogic(orderId, notes, adminId);

    if (declinedRefund?.user_id) {
        await notificationModel.createNotification({
            user_id: declinedRefund.user_id,
            type: 'error',
            title: 'Refund denied',
            message: `Your refund requerst for order #${orderId} is  denied.`,
            order_id: orderId,
        });

        io.to(`user_${declinedRefund.user_id}`).emit('order:update', {
            type: 'error',
            message: `Your refund request for order #${orderId} is denied`,
            orderId,
            newStatus: 'Refund Denied',
        });
    }

    return sendResponse(res, 200, 'Refund Request Declined', declinedRefund);
});

module.exports = { getAllRefundRequests, requestRefund, adminApproveRefund, adminDenyRefund };
