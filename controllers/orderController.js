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

module.exports = {
    checkoutFromCart 
};