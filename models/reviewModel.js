const pool = require('../database/pool');

const addReview = async ({ user_id, product_id, rating, review_text, order_id = null }) => {
    // Check if user has already reviewed this product
    const [existing] = await pool.query(
        `SELECT review_id FROM product_reviews 
         WHERE user_id = ? AND product_id = ?`,
        [user_id, product_id]
    );

    if (existing.length > 0) {
        throw new Error('You have already reviewed this product');
    }

    await pool.query(
        `INSERT INTO product_reviews (user_id, product_id, rating, review_text, order_id)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, product_id, rating, review_text, order_id]
    );
};

const getReviewsByProduct = async (product_id) => {
    const [rows] = await pool.query(
        `SELECT r.*, u.username
         FROM product_reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ?
         ORDER BY r.created_at DESC`,
        [product_id]
    );
    return rows;
};

const deleteReview = async (review_id) => {
    await pool.query(`DELETE FROM product_reviews WHERE review_id = ?`, [review_id]);
};

const getReviewedProductsByOrderAndUser = async (order_id, user_id) => {
    const [rows] = await pool.query(
        `SELECT pr.product_id
         FROM product_reviews pr
         JOIN order_items oi ON pr.product_id = oi.product_id
         WHERE oi.order_id = ? AND pr.user_id = ?`,
        [order_id, user_id]
    );
    return rows;
};

// Check if user has purchased a product (to allow reviews only for purchased products)
const hasUserPurchasedProduct = async (user_id, product_id) => {
    const [rows] = await pool.query(
        `SELECT DISTINCT oi.product_id
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.customer_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
        [user_id, product_id]
    );
    return rows.length > 0;
};

// Check if user has already reviewed a product
const hasUserReviewedProduct = async (user_id, product_id) => {
    const [rows] = await pool.query(
        `SELECT review_id FROM product_reviews 
         WHERE user_id = ? AND product_id = ?`,
        [user_id, product_id]
    );
    return rows.length > 0;
};

const getReviewsByUser = async (user_id) => {
    const [rows] = await pool.query(
        `SELECT r.*, p.name AS product_name
        FROM product_reviews r
        JOIN products p ON r.product_id = p.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        `,
        [user_id]
    );
    return rows;
};

const updateReview = async (review_id, rating, review_text) => {
    const fields = [];
    const values = [];

    if (rating !== undefined) {
        fields.push('rating = ?');
        values.push(rating);
    }

    if (review_text !== undefined) {
        fields.push('review_text = ?');
        values.push(review_text);
    }

    if (fields.length === 0) {
        return null;
    }

    values.push(review_id);

    const [result] = await pool.query(
        `UPDATE product_reviews
        SET ${fields.join(', ')}
        WHERE review_id = ?`,
        values
    );

    const [rows] = await pool.query(
        `SELECT *
        FROM product_reviews
        WHERE review_id = ?
        `,
        [review_id]
    );

    return rows[0] || null;
};

module.exports = {
    addReview,
    getReviewsByProduct,
    deleteReview,
    getReviewedProductsByOrderAndUser,
    hasUserPurchasedProduct,
    hasUserReviewedProduct,
    getReviewsByUser,
    updateReview,
};
