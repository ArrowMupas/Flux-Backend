const adminOrderModel = require('../models/adminOrderModel');
const reservationModel = require('../models/reservationModel');
const afterSalesModel = require('../models/afterSalesModel');
const HttpError = require('../helpers/errorHelper');
const pool = require('../database/pool');
const { logInventoryChange } = require('../utilities/inventoryLogUtility');
const INVENTORY_ACTIONS = require('../constants/inventoryActions');

// Logic for getting all orders
const getAllOrders = async (status, startDate = null, endDate = null) => {
    const orders = await adminOrderModel.getOrders(status, startDate, endDate);

    return await Promise.all(
        orders.map(async (o) => ({
            ...o,
            items: await adminOrderModel.getOrderItems(o.id),
        }))
    );
};

// Logic for getting order by ID
const getOrderById = async (orderId) => {
    const order = await adminOrderModel.getOrderById(orderId);

    // Check if order exist
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    const items = await adminOrderModel.getOrderItems(order.id);

    return {
        ...order,
        items,
    };
};

// Logic for getting orders by user
const getOrdersByUserId = async (userId) => {
    const orders = await adminOrderModel.getAllOrdersByUser(userId);

    // Check if user has order
    if (!orders || orders.length === 0) {
        throw new HttpError(404, 'No order found for this user');
    }

    return await Promise.all(
        orders.map(async (order) => ({
            ...order,
            items: await adminOrderModel.getOrderItems(order.id),
        }))
    );
};

// Logic for getting order status history
const getOrderStatusHistory = async (orderId) => {
    const order = await adminOrderModel.getOrderById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    return await adminOrderModel.getOrderStatusHistory(orderId);
};

// Logic for changing order status
const changeOrderStatus = async (orderId, newStatus, notes, id) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const order = await adminOrderModel.getOrderById(orderId);
        if (!order) {
            throw new HttpError(404, 'No order found');
        }

        const currentStatus = order.status;

        if (currentStatus === newStatus) {
            throw new HttpError(400, `Order is already marked as '${newStatus}'`);
        }

        const allowedTransitions = {
            pending: ['processing', 'cancelled'],
            processing: ['shipping'],
            shipping: ['delivered'],
        };

        const allowedNext = allowedTransitions[currentStatus] || [];

        if (!allowedNext.includes(newStatus)) {
            throw new HttpError(
                400,
                `Cannot change status from '${currentStatus}' to '${newStatus}'`
            );
        }

        if (currentStatus === 'pending' && newStatus === 'processing') {
            // 🔁 Get inventory changes
            const inventoryChanges = await reservationModel.deductReservedStock(
                orderId,
                connection
            );

            // 🧾 Log each change
            for (const change of inventoryChanges) {
                await logInventoryChange({
                    productId: change.productId,
                    orderId,
                    adminId: id ?? null,
                    action: INVENTORY_ACTIONS.CONFIRM,
                    changeAvailable: change.changeAvailable,
                    changeReserved: change.changeReserved,
                    oldAvailable: change.oldAvailable,
                    newAvailable: change.newAvailable,
                    oldReserved: change.oldReserved,
                    newReserved: change.newReserved,
                    reason: 'Stock moved from reserved to sold',
                    dbConnection: connection,
                });
            }
        }

        await adminOrderModel.changeOrderStatus(orderId, newStatus, notes, connection);

        await connection.commit();
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Logic for admin cancelling an order
const adminCancelOrder = async (orderId, notes) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const order = await adminOrderModel.getOrderById(orderId, connection);
        if (!order) {
            throw new HttpError(404, 'Order not found');
        }

        if (order.status !== 'pending') {
            throw new HttpError(400, 'Only pending orders can be cancelled');
        }

        if (!order.cancel_requested) {
            throw new HttpError(400, 'Order has no pending cancel request');
        }

        // Release stock reservation
        await reservationModel.releaseReservedStock(orderId, connection);

        // Change status to cancelled
        await adminOrderModel.changeOrderStatus(orderId, 'cancelled', notes, connection);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Logic for marking refund/return request as pending
const markRefundReturnPending = async (requestId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const request = await afterSalesModel.getRefundById(requestId, connection);
        if (!request) {
            throw new HttpError(404, 'Request not found');
        }

        await afterSalesModel.updateRequestStatus(requestId, 'pending', connection);

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Logic for marking refund/return request as completed
const markRefundReturnCompleted = async (requestId, notes) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const request = await afterSalesModel.getRefundById(requestId, connection);

        if (!request) {
            throw new HttpError(404, 'Refund request not found');
        }

        await afterSalesModel.updateRequestStatus(requestId, 'completed', connection);

        let newStatus;
        if (request.type === 'refund') {
            newStatus = 'refunded';
        } else if (request.type === 'return') {
            newStatus = 'returned';
        }

        await adminOrderModel.changeOrderStatus(request.order_id, newStatus, notes, connection);

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    getOrderStatusHistory,
    changeOrderStatus,
    adminCancelOrder,
    markRefundReturnPending,
    markRefundReturnCompleted,
};
