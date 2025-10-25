const orderModel = require('../models/orderModel');
const adminOrderModel = require('../models/adminOrderModel');
const HttpError = require('../helpers/errorHelper');
const returnModel = require('../models/returnModel');
const pool = require('../database/pool');

const getAllReturnRequests = async () => {
    return await returnModel.getAllReturnRequests();
};

const requestReturnLogic = async (orderId, customerId, reason, contactNumber, imageURL) => {
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    if (order.customer_id !== customerId) {
        throw new HttpError(401, 'You are not authorized to request a return for this order.');
    }

    const currentStatus = order.status;
    if (currentStatus === 'returned') {
        throw new HttpError(400, `Order is already marked as 'returned'`);
    }

    if (currentStatus !== 'delivered') {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to 'returned'`);
    }

    const existing = await returnModel.checkExistingReturn(orderId);
    if (existing) {
        throw new HttpError(400, 'A return request for this order already exists.');
    }

    const delivery = await returnModel.getLatestDeliveredDate(orderId);

    const deliveredAt = new Date(delivery.status_date);

    const now = new Date();
    const diffDays = (now - deliveredAt) / (1000 * 60 * 60 * 24);

    if (diffDays > 3) {
        throw new HttpError(400, 'Return requests can only be made within 3 days of delivery.');
    }

    return await returnModel.createReturnRequest(orderId, customerId, reason, contactNumber, imageURL);
};

const approveReturnLogic = async (orderId, notes) => {
    const order = await returnModel.getOrderStatusAndReturn(orderId);
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    const currentStatus = order.status;
    if (currentStatus === 'returned') {
        throw new HttpError(400, `Order is already marked as 'returned'`);
    }

    if (currentStatus !== 'delivered') {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to 'returned'`);
    }

    if (!order.has_pending_return) {
        throw new HttpError(400, `This order do not have any return requests'`);
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await returnModel.approveReturnRequest(orderId, notes, connection);
        await adminOrderModel.changeOrderStatus(orderId, 'returned', notes, connection);
        await connection.commit();
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const denyReturnLogic = async (orderId, notes) => {
    const order = await returnModel.getOrderStatusAndReturn(orderId);
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    const currentStatus = order.status;
    if (currentStatus === 'returned') {
        throw new HttpError(400, `Order is already marked as 'returned'`);
    }

    if (currentStatus !== 'delivered') {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to 'returned'`);
    }

    if (!order.has_pending_return) {
        throw new HttpError(400, `This order do not have any return requests'`);
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await returnModel.denyReturnRequest(orderId, notes, connection);
        await connection.commit();
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { getAllReturnRequests, requestReturnLogic, approveReturnLogic, denyReturnLogic };
