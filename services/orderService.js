const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const paymentModel = require('../models/paymentModel');
const productModel = require('../models/productModel');
const couponService = require('./couponService');
const pool = require('../database/pool');
const HttpError = require('../helpers/errorHelper');
const { generateOrderId } = require('../helpers/orderIdHelper');
const { logInventoryChange } = require('../utilities/inventoryLogUtility');
const INVENTORY_ACTIONS = require('../constants/inventoryActions');

// Logic of creating an order
const createOrder = async (
    userId,
    { payment_method, address, notes, reference_number, account_name, couponCode }
) => {
    // Get cart items (no coupon logic here)
    const cart = await cartModel.getCartItemsByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
        throw new HttpError(404, 'Cart is empty');
    }

    const todayCount = await orderModel.getTodayOrderCountByUser(userId);
    if (todayCount >= 100) {
        throw new HttpError(429, "You've reached your 3 orders today. Try again tomorrow.");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Apply coupon logic INSIDE the transaction to ensure consistency
        const couponResult = await couponService.applyCouponToOrder(couponCode, cart.cart_total);

        const generatedID = generateOrderId();
        const orderId = await orderModel.createOrder(
            {
                id: generatedID,
                customer_id: userId,
                total_amount: couponResult.finalTotal,
                discount_amount: couponResult.discount,
                coupon_code: couponResult.coupon ? couponResult.coupon.code : null,
                status: 'pending',
                notes,
            },
            connection
        );

        // If coupon was used, mark it as used (if you have usage tracking)
        if (couponResult.coupon && couponResult.discount > 0) {
            console.log(
                `Coupon ${couponResult.coupon.code} applied to order ${orderId} with discount ${couponResult.discount}`
            );
        }

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

            const { oldAvailable, newAvailable, oldReserved, newReserved } =
                await productModel.checkAndReserveStock(
                    item.product_id,
                    item.quantity,
                    orderId,
                    connection
                );

            await logInventoryChange({
                productId: item.product_id,
                orderId,
                userId,
                action: INVENTORY_ACTIONS.RESERVE,
                changeAvailable: -item.quantity,
                oldAvailable,
                newAvailable,
                changeReserved: item.quantity,
                oldReserved,
                newReserved,
                dbConnection: connection,
            });
        }

        await orderModel.createOrderStatus(
            {
                orderId,
                newStatus: 'pending',
                notes: 'pending',
            },
            connection
        );

        const existingPayment = await paymentModel.getPaymentByOrderId(orderId, connection);
        if (existingPayment) {
            throw new HttpError(400, 'Payment for this order already submitted');
        }

        const paymentId = await paymentModel.createPayment(
            orderId,
            payment_method,
            reference_number,
            account_name,
            address,
            connection
        );

        await cartModel.clearCart(userId, connection);
        try {
            await connection.commit();
        } catch (commitError) {
            console.error('Commit failed: ', commitError);
            await connection.rollback();
            throw commitError;
        }
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
