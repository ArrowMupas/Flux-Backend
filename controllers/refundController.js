const asyncHandler = require('express-async-handler');
const refundService = require('../services/refundService');
const sendResponse = require('../middlewares/responseMiddleware');

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

    const approvedRefund = await refundService.approveRefundLogic(orderId, notes, adminId);

    return sendResponse(res, 200, 'Refund Request Approved', approvedRefund);
});

const adminDenyRefund = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { orderId } = req.params;
    const adminId = req.user.id;

    const declinedRefund = await refundService.denyRefundLogic(orderId, notes, adminId);

    return sendResponse(res, 200, 'Refund Request Declined', declinedRefund);
});

module.exports = { getAllRefundRequests, requestRefund, adminApproveRefund, adminDenyRefund };
