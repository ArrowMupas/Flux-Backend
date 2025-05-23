const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const pool = require('../database/pool');
const HttpError = require('../helpers/errorHelper');

// Logic of creating order
const createOrder = async (userId, { payment_method, address, notes }) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const cart = await cartModel.getCartItemsByUserId(userId);
        // Check if cart has items
        if (!cart.items || cart.items.length === 0) {
            throw new HttpError(404, 'Cart is empty');
        }

        // Create the order
        const orderId = await orderModel.createOrder(
            {
                customer_id: userId,
                total_amount: cart.cart_total,
                status: 'pending',
                notes,
            },
            connection
        );

        // Add items of the order
        for (const item of cart.items) {
            await orderModel.addOrderItem(
                {
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    subtotal: item.price * item.quantity,
                },
                connection
            );
        }

        // Set initial status, Log it in status history
        await orderModel.createOrderStatus(
            {
                orderId,
                newStatus: 'pending',
                notes: 'pending',
            },
            connection
        );

        await cartModel.clearCart(userId);
        await connection.commit();
        return orderId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Logic of getting orders
const getOrders = async (userId, status) => {
    // Get order based on status
    const orders = status
        ? await orderModel.getOrdersByUserAndStatus(userId, status)
        : await orderModel.getAllOrdersByUser(userId); // If no status get all orders

    const detailed = await Promise.all(
        orders.map(async (o) => ({
            ...o,
            items: await orderModel.getOrderItems(o.order_id),
        }))
    );

    return detailed;
};

// Logic of getting order status history
const getOrderStatusHistory = async (userId, orderId) => {
    const order = await orderModel.getOrderById(orderId);
    if (!order) throw new HttpError(404, 'Order not found');

    // Makes sure user is accesing own order
    if (order.customer_id !== userId) throw new HttpError(403, 'Not Authorized');

    return await orderModel.getOrderStatusHistory(orderId);
};

// Logic of cancelling order
const cancelOrder = async (userId, orderId, notes) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const order = await orderModel.getOrderById(orderId, connection);
        if (!order) throw new HttpError(404, 'Order not found');
        if (order.customer_id !== userId)
            throw new HttpError(403, 'You are not allowed to cancel this order');

        let message = '';

        if (order.status === 'pending') {
            await orderModel.cancelOrder(orderId, notes, connection);
            message = 'Order cancelled successfully.';
        } else if (order.status === 'processing' || order.status === 'shipped') {
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
