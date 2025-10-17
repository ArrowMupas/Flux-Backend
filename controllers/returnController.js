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

module.exports = { getAllReturnRequests, requestReturn };
