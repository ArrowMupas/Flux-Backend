const pool = require('../database/pool');

// Function to get a cart by user ID
const getCartItemsByUserId = async (userId) => {
    const [items] = await pool.query(
        `SELECT 
         cart.id AS cart_item_id,
         cart.quantity,
         products.id AS product_id,
         products.name,
         products.price,
         products.image,
         products.stock_quantity,
         products.description
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = ?`,
        [userId]
    );

    // Calculate total cart price
    const [[total]] = await pool.query(
        `SELECT 
         SUM(cart.quantity * products.price) AS cart_total
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.user_id = ?`,
        [userId]
    );

    return {
        user_id: userId,
        cart_total: total.cart_total || 0, // Default to 0 if no item
        items,
    };
};

// Function to add to cart
const addToCart = async (userId, productId, quantity = 1) => {
    // Transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Check if product exists and get stock
        const [product] = await connection.query(
            'SELECT stock_quantity FROM products WHERE id = ?',
            [productId]
        );

        if (product.length === 0) {
            throw new Error('Product not found');
        }

        const availableStock = product[0].stock_quantity;

        // Return error if requested quantity exceeds stock
        if (quantity > availableStock) {
            throw new Error('Requested quantity exceeds available stock');
        }

        // Check if item is already in cart
        const [existing] = await connection.query(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        let result;

        if (existing.length > 0) {
            // Update quantity if item is already in cart
            result = await connection.query(
                'UPDATE cart SET quantity = LEAST(quantity + ?, ?) WHERE user_id = ? AND product_id = ?',
                [quantity, availableStock, userId, productId]
            );
            result = result[0];
            await connection.commit();
            return await getCartItemsByUserId(userId);
        } else {
            // Add item if item is not in cart
            result = await connection.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, quantity]
            );
            result = result[0];
            await connection.commit();
            return await getCartItemsByUserId(userId);
        }
    } catch (error) {
        await connection.rollback(); // Roll back transaction if error occurs
        throw error;
    } finally {
        connection.release();
    }
};

// Function to update cart
const updateCartItemQuantity = async (userId, productId, quantity) => {
    // Check if update quantity is at least 1
    if (quantity < 1) {
        throw new Error('Quantity must be at least 1.');
    }

    // Transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Check if product exists and get stock
        const [product] = await connection.query(
            'SELECT stock_quantity FROM products WHERE id = ?',
            [productId]
        );

        if (product.length === 0) {
            throw new Error('Product not found.');
        }

        const availableStock = product[0].stock_quantity;

        // Return error if requested quantity exceeds stock
        if (quantity > availableStock) {
            throw new Error('Requested quantity exceeds available stock.');
        }

        // Update cart
        const [result] = await connection.query(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, productId]
        );

        // Return error if nothing changed
        if (result.affectedRows === 0) {
            throw new Error('Cart item not found or no changes made.');
        }

        await connection.commit();
        const updatedCart = await getCartItemsByUserId(userId);
        return updatedCart;
    } catch (error) {
        await connection.rollback(); // Roll back transaction if error occurs
        throw error;
    } finally {
        connection.release();
    }
};

// Function to remove item from cart
const removeCartItem = async (userId, productId) => {
    const [result] = await pool.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [
        userId,
        productId,
    ]);
    return await getCartItemsByUserId(userId);
};

// Function to clear cart
const clearCart = async (userId, connection = pool) => {
    const [result] = await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    return await getCartItemsByUserId(userId);
};

module.exports = {
    getCartItemsByUserId,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
