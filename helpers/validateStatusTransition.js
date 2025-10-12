const HttpError = require('../helpers/errorHelper');
const adminOrderModel = require('../models/adminOrderModel');

// DRY helper for pre-checks
const validateStatusTransition = async (orderId, targetStatus, validCurrentStatus) => {
    const order = await adminOrderModel.getOrderById(orderId);
    if (!order) throw new HttpError(404, 'No order found');

    const currentStatus = order.status;

    if (currentStatus === targetStatus) {
        throw new HttpError(400, `Order is already marked as '${targetStatus}'`);
    }

    if (currentStatus !== validCurrentStatus) {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to '${targetStatus}'`);
    }

    return order; // return order for further logic
};

module.exports = validateStatusTransition;
