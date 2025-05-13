const asyncHandler = require('express-async-handler');
const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const sendResponse = require('../middlewares/responseMiddleware');
const pool = require('../database/pool');

// Create order
const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { payment_method, address, notes } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction(); // Database Transaction

    try {
        // Make sure cart is not empty
        const cart = await cartModel.getCartItemsByUserId(userId);
        if (!cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Create order
        const orderId = await orderModel.createOrder({
            customer_id: userId,
            total_amount: cart.cart_total,
            status: 'pending',
            payment_method: payment_method,
            address: address,
            notes: notes,
        });

        // Add order items
        for (const item of cart.items) {
            await orderModel.addOrderItem({
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.price * item.quantity,
            });
        }

        // Add order status history
        await orderModel.createOrderStatus({
            orderId: orderId,
            newStatus: 'pending',
            notes: 'pending',
        });

        // Clear cart
        await cartModel.clearCart(userId);
        await connection.commit();

        return sendResponse(res, 200, 'Order Created', orderId);
    } catch (error) {
        await connection.rollback();
        res.status(400).json({
            success: false,
            message: error.message,
        });
    } finally {
        connection.release();
    }
});

// Get order by status
const getOrderByStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const status = req.params.status || req.query.status;

    // Validate status field
    if (!status) {
        res.status(400);
        throw new Error('Order status is required');
    }

    // Get order by user_id and status
    const orders = await orderModel.getOrdersByUserAndStatus(userId, status);

    // Get items and history for each order
    const detailedOrders = await Promise.all(
        orders.map(async (order) => {
            const items = await orderModel.getOrderItems(order.order_id);
            const statusHistory = await orderModel.getOrderStatusHistory(order.order_id);

            return {
                ...order,
                items,
                statusHistory,
            };
        })
    );

    return sendResponse(res, 200, 'Orders fetched', detailedOrders);
});

// const addOrderItem = asyncHandler(async (req, res) => {
//     const orderId = req.params.id;
//     const { product_id, quantity, unit_price } = req.body;

//     // Verify order exists
//     const order = await orderModel.getOrderById(orderId);
//     if (!order) {
//         res.status(404);
//         throw new Error('Order not found');
//     }

//     // Get product price if not provided
//     let price = unit_price;
//     if (!price) {
//         const [[product]] = await pool.query('SELECT price FROM products WHERE id = ?', [
//             product_id,
//         ]);
//         if (!product) {
//             res.status(404);
//             throw new Error('Product not found');
//         }
//         price = product.price;
//     }

//     // Add item to order
//     const itemId = await orderModel.addOrderItem({
//         order_id: orderId,
//         product_id,
//         quantity,
//         unit_price: price,
//         subtotal: price * quantity,
//     });

//     // Update order total
//     await orderModel.updateOrderTotal(orderId);

//     res.status(201).json({
//         success: true,
//         itemId,
//         message: 'Item added to order',
//     });
// });

// const updateOrderStatus = asyncHandler(async (req, res) => {
//     const orderId = req.params.id;
//     const { status, notes = '' } = req.body;

//     // Verify order exists
//     const order = await orderModel.getOrderById(orderId);
//     if (!order) {
//         res.status(404);
//         throw new Error('Order not found');
//     }

//     // Validate status
//     const validStatuses = [
//         'pending',
//         'processing',
//         'shipped',
//         'delivered',
//         'cancelled',
//         'refunded',
//     ];
//     if (!validStatuses.includes(status)) {
//         res.status(400);
//         throw new Error('Invalid status value');
//     }

//     // Update status
//     await orderModel.updateOrderStatus(orderId, status, notes);

//     res.json({
//         success: true,
//         message: 'Order status updated',
//     });
// });

module.exports = {
    createOrder,
    getOrderByStatus,
    // updateOrderStatus,
    // addOrderItem,
};
