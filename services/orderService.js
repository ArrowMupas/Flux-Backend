const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const pool = require('../database/pool');
const HttpError = require('../helpers/errorHelper');
const {
    validateCart,
    enforceOrderLimit,
    createNewOrder,
    addItemsAndReserveStock,
    createInitialOrderStatus,
    handlePayment,
} = require('../workflows/createOrderWorkflow');

// Logic of creating an order
const createOrder = async (
    userId,
    { payment_method, address, notes, reference_number, account_name }
) => {
    const cart = await validateCart(userId);
    await enforceOrderLimit(userId);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const orderId = await createNewOrder({
            userId,
            subtotal: cart.cart_total,
            total: cart.final_total,
            discount: cart.discount,
            coupon_code: cart.coupon_code,
            notes,
            connection,
        });

        await addItemsAndReserveStock({ cart, orderId, userId, connection });
        await createInitialOrderStatus(orderId, connection);

        const paymentId = await handlePayment({
            orderId,
            payment_method,
            reference_number,
            account_name,
            address,
            connection,
        });

        await cartModel.clearCart(cart.cart_id || cart.id, connection);
        await connection.commit();
        return { orderId, paymentId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Logic of getting orders
const getOrders = async (userId, filters = {}) => {
    const { status = [], payment_methods = [] } = filters;

    const orders = await orderModel.getFilteredOrders(userId, status, payment_methods);

    return await Promise.all(
        orders.map(async (o) => ({
            ...o,
            items: await orderModel.getOrderItems(o.id),
        }))
    );
};

// Logic of getting order status history
const getOrderStatusHistory = async (userId, orderId) => {
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
        throw new HttpError(404, 'Order not found');
    }

    // Makes sure user is accessing own order
    if (order.customer_id !== userId) {
        throw new HttpError(403, 'Not Authorized');
    }

    return await orderModel.getOrderStatusHistory(orderId);
};

// Logic of cancelling order
const cancelOrder = async (userId, orderId, notes) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const order = await orderModel.getOrderById(orderId, connection);
        if (!order) {
            throw new HttpError(404, 'Order not found');
        }
        if (order.customer_id !== userId) {
            throw new HttpError(403, 'You are not allowed to cancel this order');
        }

        let message = '';

        if (
            order.status === 'pending' ||
            order.status === 'processing' ||
            order.status === 'shipping'
        ) {
            if (order.cancel_requested) {
                throw new HttpError(
                    400,
                    'Cancel request already submitted. Wait for admin to review'
                );
            }
            await orderModel.createCancelRequest(orderId, notes, connection);
            message = 'Cancel request submitted. Admin will review it.';
        } else if (order.status === 'delivered') {
            throw new HttpError(400, 'Order has already been delivered and cannot be cancelled.');
        } else if (order.status === 'cancelled') {
            throw new HttpError(400, 'Order is already cancelled.');
        } else {
            throw new HttpError(400, 'Order cannot be cancelled at this stage.');
        }

        await connection.commit();
        return message;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = { createOrder, getOrders, getOrderStatusHistory, cancelOrder };
