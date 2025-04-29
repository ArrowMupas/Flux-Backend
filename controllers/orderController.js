const asyncHandler = require('express-async-handler');
const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel'); 
const pool = require('../database/pool'); 

const checkoutFromCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Fetch cart items
        const cart = await cartModel.getCartItemsByUserId(userId);
        if (!cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // 2. Create order
        const orderId = await orderModel.createOrder({
            customer_id: userId,
            total_amount: cart.cart_total,
            status: 'pending'
        });

        // 3. Add items to order_items and update stock
        for (const item of cart.items) {
            await orderModel.addOrderItem({
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.price * item.quantity
            });

            // Deduct stock
            await pool.query(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // 4. Clear cart
        await cartModel.clearCart(userId);
        await connection.commit();
        res.status(201).json({ 
            success: true, 
            orderId, 
            message: 'Order created successfully' 
        });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    } finally {
        connection.release();
    }
});

const addOrderItem = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const { product_id, quantity, unit_price } = req.body;

    // Verify order exists
    const [order] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order.length) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Get product price if not provided
    let price = unit_price;
    if (!price) {
        const [[product]] = await pool.query(
            'SELECT price FROM products WHERE id = ?',
            [product_id]
        );
        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }
        price = product.price;
    }

    // Add item to order
    const [result] = await pool.query(
        `INSERT INTO order_items 
         (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, product_id, quantity, price, price * quantity]
    );

    // Update order total
    await pool.query(
        `UPDATE orders 
         SET total_amount = (
             SELECT SUM(subtotal) 
             FROM order_items 
             WHERE order_id = ?
         ) 
         WHERE order_id = ?`,
        [orderId, orderId]
    );

    res.status(201).json({
        success: true,
        itemId: result.insertId,
        message: 'Item added to order'
    });
});



const getOrderDetails = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const [order] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    
    if (!order.length) {
        res.status(404);
        throw new Error('Order not found');
    }

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    const [statusHistory] = await pool.query('SELECT * FROM order_status_history WHERE order_id = ?', [orderId]);

    res.json({
        ...order[0],
        items,
        statusHistory
    });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const { status, notes = '' } = req.body;

    // Verify order exists
    const [order] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order.length) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error('Invalid status value');
    }

    // Update order status
    await pool.query(
        `UPDATE orders SET status = ? WHERE order_id = ?`,
        [status, orderId]
    );

    // Record in history
    await pool.query(
        `INSERT INTO order_status_history 
         (order_id, status, notes) 
         VALUES (?, ?, ?)`,
        [orderId, status, notes]
    );

    res.json({
        success: true,
        message: 'Order status updated'
    });
});

module.exports = {
    checkoutFromCart,
    getOrderDetails,
    updateOrderStatus,
    addOrderItem
};