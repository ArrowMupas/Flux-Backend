const adminOrderModel = require('../models/adminOrderModel');
const reservationModel = require('../models/reservationModel');
const loyaltyModel = require('../models/loyaltyModel');
const HttpError = require('../helpers/errorHelper');
const pool = require('../database/pool');
const { logInventoryChange } = require('../utilities/inventoryLogUtility');
const INVENTORY_ACTIONS = require('../constants/inventoryActions');
const validateStatusTransition = require('../helpers/validateStatusTransition');

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

// Logic for admin cancelling an order
const adminCancelOrder = async (orderId, notes, adminId) => {
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

        const orderItems = await adminOrderModel.getOrderItems(orderId, connection);

        // Release stock reservation
        await reservationModel.releaseReservedStock(orderId, connection);

        for (const item of orderItems) {
            await logInventoryChange({
                productId: item.product_id,
                orderId,
                adminId,
                action: INVENTORY_ACTIONS.CANCEL_RESERVE,
                changeAvailable: item.quantity,
                changeReserved: -item.quantity,
                reason: `Order ${orderId} cancelled by admin`,
            });
        }

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

// old logic for status change.
// We are keeping it for reference in case we need to revert back
const changeOrderStatus = async (orderId, newStatus, notes, adminId) => {
    const order = await adminOrderModel.getOrderById(orderId);
    if (!order) throw new HttpError(404, 'No order found');

    const currentStatus = order.status;
    if (currentStatus === newStatus) throw new HttpError(400, `Order is already marked as '${newStatus}'`);

    const allowedTransitions = {
        pending: ['processing', 'cancelled'],
        processing: ['shipping'],
        shipping: ['delivered'],
    };

    const allowedNext = allowedTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
        throw new HttpError(400, `Cannot change status from '${currentStatus}' to '${newStatus}'`);
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // ✅ Only run transactional logic now
        if (currentStatus === 'pending' && newStatus === 'processing') {
            const inventoryChanges = await reservationModel.deductReservedStock(orderId, connection);

            for (const change of inventoryChanges) {
                await logInventoryChange({
                    productId: change.productId,
                    orderId,
                    adminId: adminId ?? null,
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

// New logics for each status transition
// Looks repetetive but when we start adding more complex logic it will be easier to manage
const pendingToProcessingLogic = async (orderId, notes, adminId) => {
    await validateStatusTransition(orderId, 'processing', 'pending');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const inventoryChanges = await reservationModel.deductReservedStock(orderId, connection);
        for (const change of inventoryChanges) {
            await logInventoryChange({
                productId: change.productId,
                orderId,
                adminId: adminId ?? null,
                action: INVENTORY_ACTIONS.CONFIRM,
                changeAvailable: 0,
                changeReserved: change.changeReserved,
                reason: 'Stock moved from reserved to sold',
            });
        }

        await adminOrderModel.changeOrderStatus(orderId, 'processing', notes, connection);
        await connection.commit();

        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const processingToShippingLogic = async (orderId, notes, shipping_price, shipping_company, order_reference_number) => {
    await validateStatusTransition(orderId, 'shipping', 'processing');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await adminOrderModel.addShippingRecord(
            orderId,
            shipping_price,
            shipping_company,
            order_reference_number,
            connection
        );
        await adminOrderModel.changeOrderStatus(orderId, 'shipping', notes, connection);
        await connection.commit();
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const shippingToDeliveredLogic = async (orderId, notes) => {
    const order = await validateStatusTransition(orderId, 'delivered', 'shipping');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await adminOrderModel.changeOrderStatus(orderId, 'delivered', notes, connection);
        await connection.commit();
        await loyaltyModel.updateUserLoyaltyProgress(order.user_id);
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    getOrderStatusHistory,
    adminCancelOrder,
    changeOrderStatus,
    pendingToProcessingLogic,
    processingToShippingLogic,
    shippingToDeliveredLogic,
};
