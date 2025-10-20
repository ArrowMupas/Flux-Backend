const orderModel = require('../models/orderModel');
const adminOrderModel = require('../models/adminOrderModel');
const HttpError = require('../helpers/errorHelper');
const refundModel = require('../models/refundModel');
const pool = require('../database/pool');

const getAllRefundRequests = async () => {
    return await refundModel.getAllRefundRequests();
};

const requestRefundLogic = async (orderId, customerId, reason, contactNumber) => {
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    if (order.customer_id !== customerId) {
        throw new HttpError(401, 'You are not authorized to request a refund for this order.');
    }

    const currentStatus = order.status;
    if (currentStatus === 'refunded') {
        throw new HttpError(400, `Order is already marked as 'refunded'`);
    }

    if (currentStatus !== 'cancelled') {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to 'refunded'`);
    }

    const existing = await refundModel.checkExistingRefund(orderId);
    if (existing) {
        throw new HttpError(400, 'A refund request for this order already exists.');
    }

    const delivery = await refundModel.getLatestCancelledDate(orderId);

    const deliveredAt = new Date(delivery.status_date);

    const now = new Date();
    const diffDays = (now - deliveredAt) / (1000 * 60 * 60 * 24);

    if (diffDays > 14) {
        throw new HttpError(400, 'Refund requests can only be made within 14 days after being cancelled.');
    }

    return await refundModel.createRefundRequest(orderId, customerId, reason, contactNumber);
};

const approveRefundLogic = async (orderId, notes, adminId) => {
    const order = await refundModel.getOrderStatusAndRefund(orderId);
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    const currentStatus = order.status;
    if (currentStatus === 'refunded') {
        throw new HttpError(400, `Order is already marked as 'refunded'`);
    }

    if (currentStatus !== 'cancelled') {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to 'refunded'`);
    }

    if (!order.has_pending_refund) {
        throw new HttpError(400, `This order do not have any refund requests'`);
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await refundModel.approveRefundRequest(orderId, notes, adminId, connection);
        await adminOrderModel.changeOrderStatus(orderId, 'refunded', notes, connection);
        await connection.commit();
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const denyRefundLogic = async (orderId, notes, adminId) => {
    const order = await refundModel.getOrderStatusAndRefund(orderId);
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    const currentStatus = order.status;
    if (currentStatus === 'refunded') {
        throw new HttpError(400, `Order is already marked as 'refunded'`);
    }

    if (currentStatus !== 'cancelled') {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to 'refunded'`);
    }

    if (!order.has_pending_refund) {
        throw new HttpError(400, `This order do not have any refund requests'`);
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await refundModel.denyRefundRequest(orderId, notes, adminId, connection);
        await connection.commit();
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { getAllRefundRequests, requestRefundLogic, approveRefundLogic, denyRefundLogic };
