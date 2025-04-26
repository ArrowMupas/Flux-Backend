const asyncHandler = require('express-async-handler');
const orderModel = require('../models/orderModel');
const pool = require('../database/pool'); // Add this line

const createOrder = asyncHandler(async (req, res) => {
    const { customer_id, items, ...orderData } = req.body;
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        // Add customer_id to orderData since it was destructured out
        orderData.customer_id = customer_id;
        const orderId = await orderModel.createOrder(orderData);
        
        for (const item of items) {
            await orderModel.addOrderItem({
                order_id: orderId,
                product_id: item.product_id, // Make sure this matches your frontend data
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal
            });
        }
        
        await connection.commit();
        res.status(201).json({ 
            success: true,
            orderId,
            message: 'Order created successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Order creation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating order',
            error: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = {
    createOrder
};