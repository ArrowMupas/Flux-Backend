const asyncHandler = require('express-async-handler');
const returnService = require('../services/returnService');
const sendResponse = require('../middlewares/responseMiddleware');

const getAllReturnRequests = asyncHandler(async (req, res) => {
    const requests = await returnService.getAllReturnRequests();

    return sendResponse(res, 200, 'Return requests retrieved successfully', requests);
});

const requestReturn = asyncHandler(async (req, res) => {
    const { reason, contact_number } = req.body;
    const { orderId } = req.params;
    const customerId = req.user.id;

    const returnRequest = await returnService.requestReturnLogic(orderId, customerId, reason, contact_number);

    return sendResponse(res, 200, 'Return Request Sent.', returnRequest);
});

const adminApproveReturn = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { orderId } = req.params;

    const approvedReturn = await returnService.approveReturnLogic(orderId, notes);

    return sendResponse(res, 200, 'Return Request Approved', approvedReturn);
});

const adminDenyReturn = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { orderId } = req.params;

    const declinedReturn = await returnService.denyReturnLogic(orderId, notes);

    return sendResponse(res, 200, 'Return Request Declined', declinedReturn);
});

module.exports = { getAllReturnRequests, requestReturn, adminApproveReturn, adminDenyReturn };
