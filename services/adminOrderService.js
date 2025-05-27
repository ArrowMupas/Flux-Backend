const adminOrderModel = require('../models/adminOrderModel');
const reservationModel = require('../models/reservationModel');
const userModel = require('../models/userModel');
const HttpError = require('../helpers/errorHelper');
const { sendEmail } = require('../utilities/emailUtility');
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
            items: await adminOrderModel.getOrderItems(o.id),
        }))
    );

    return detailed;
};

// Logic for getting order by ID
const getOrderById = async (orderId) => {
    const order = await adminOrderModel.getOrderById(orderId);

    // Check if order exist
    if (!order) throw new HttpError(404, 'Order not found');

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

    const detailed = await Promise.all(
        orders.map(async (order) => ({
            ...order,
            items: await adminOrderModel.getOrderItems(order.id),
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

        await adminOrderModel.changeOrderStatus(orderId, newStatus, notes, connection);

        if (currentStatus === 'pending' && newStatus === 'processing') {
            await reservationModel.deductReservedStock(orderId, connection);
        }

        await adminOrderModel.changeOrderStatus(orderId, newStatus, notes, connection);

        const user = await userModel.getUserById(order.customer_id);

        await sendEmail({
            to: user.email,
            subject: `Your order #${orderId} status changed to "${newStatus}"`,
            html: `
        <h2>Hello, ${user.username}</h2>
        <p>Your order with ID <strong>#${orderId}</strong> has been updated.</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        <p>If you have any questions, please contact our support team.</p>
    `,
        });

        await connection.commit();
        return await adminOrderModel.getOrderById(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const adminCancelOrder = async (orderId, notes) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const order = await adminOrderModel.getOrderById(orderId, connection);
        if (!order) throw new HttpError(404, 'Order not found');

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

        const user = await userModel.getUserById(order.customer_id);

        await sendEmail({
            to: user.email,
            subject: `Your order #${orderId} has been cancelled"`,
            html: `
        <h2>Hello, ${user.username}</h2>
        <p>Your order with ID <strong>#${orderId}</strong> has been cancelled.</p>
        <p>If you have any questions, please contact our support team.</p>
    `,
        });

        await connection.commit();
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
    changeOrderStatus,
    adminCancelOrder,
};
