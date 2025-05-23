const adminOrderModel = require('../models/adminOrderModel');
const HttpError = require('../helpers/errorHelper');
const pool = require('../database/pool');

// Logic for getting all orders
const getAllOrders = async (status) => {
    // Get data bases on status
    const orders = status
        ? await adminOrderModel.getOrdersByStatus(status)
        : await adminOrderModel.getAllOrders(); // If no status, get all order instead

    const detailed = await Promise.all(
        orders.map(async (o) => ({
            ...o,
            items: await adminOrderModel.getOrderItems(o.order_id),
        }))
    );

    return detailed;
};

// Logic for getting order by ID
const getOrderById = async (orderId) => {
    const order = await adminOrderModel.getOrderById(orderId);

    // Check if order exist
    if (!order) throw new HttpError(404, 'Order not found');

    const items = await adminOrderModel.getOrderItems(order.order_id);

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

    const detailed = await Promise.all(
        orders.map(async (order) => ({
            ...order,
            items: await adminOrderModel.getOrderItems(order.order_id),
        }))
    );

    return detailed;
};

// Logic for getting order status history
const getOrderStatusHistory = async (orderId) => {
    const order = await adminOrderModel.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    return await adminOrderModel.getOrderStatusHistory(orderId);
};

// Logic for changing order status
const changeOrderStatus = async (orderId, newStatus, notes) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const order = await adminOrderModel.getOrderById(orderId);
        if (!order) throw new HttpError(404, 'No order found');

        // Status won't be changed if new status is same as current status
        if (order.status === newStatus)
            throw new HttpError(400, `Order is already marked as '${newStatus}'`);

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

const adminCancelOrder = async (orderId, notes, connection = pool) => {
    const order = await adminOrderModel.getOrderById(orderId);
    if (!order) throw new HttpError(404, 'Order not found');

    if (!order.cancel_requested) throw new HttpError(400, 'Order has no pending cancel request');

    await adminOrderModel.changeOrderStatus(orderId, 'cancelled', notes);
};

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    getOrderStatusHistory,
    changeOrderStatus,
    adminCancelOrder,
};
