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
        `INSERT INTO product_reviews (user_id, product_id, rating, review_text, order_id, status)
        VALUES (?, ?, ?, ?, ?, 'active')`,
        [user_id, product_id, rating, review_text, order_id]
    );
};

const getReviewsByProduct = async (product_id) => {
    const [rows] = await pool.query(
        `SELECT r.*, u.username
        FROM product_reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ? AND r.status = 'active'
        ORDER BY r.created_at DESC`,
        [product_id]
    );
    return rows;
};

//Helper
const getReviewById = async (review_id) => {
    const [rows] = await pool.query(
        `SELECT *
        FROM product_reviews
        WHERE review_id = ?
        `,
        [review_id]
    );
    return rows[0] || null;
};

const deleteReview = async (review_id) => {
    await pool.query(`DELETE FROM product_reviews WHERE review_id = ?`, [review_id]);
};

// Admin Get All reviews
const getAllReviews = async () => {
    const [rows] = await pool.query(
        `SELECT r.*, u.username, p.name AS product_name
        FROM product_reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        ORDER BY r.created_at DESC`
    );
    return rows;
};

// Get Flagged Reviews for Admin
const getFlaggedReviews = async () => {
    const [rows] = await pool.query(
        `SELECT r.*, u.username, p.name AS product_name
        FROM product_reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        WHERE r.status = 'flagged'
        ORDER BY r.created_at DESC`
    );
    return rows;
};

// Update review status. The status are Active, Flagged and removed
const updateReviewStatus = async (review_id, status) => {
    const [result] = await pool.query(
        `UPDATE product_reviews
        SET status = ?
        WHERE review_id = ?`,
        [status, review_id]
    );
    return result.affectedRows > 0;
};

const getReviewsByUser = async (user_id) => {
    const [rows] = await pool.query(
        `SELECT r.*, p.name AS product_name
        FROM product_reviews r
        JOIN products p ON r.product_id = p.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC`,
        [user_id]
    );
    return rows;
};

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

const hasUserReviewedProduct = async (user_id, product_id) => {
    const [rows] = await pool.query(
        `SELECT review_id FROM product_reviews 
        WHERE user_id = ? AND product_id = ?`,
        [user_id, product_id]
    );
    return rows.length > 0;
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

module.exports = {
    addReview,
    getReviewsByProduct,
    getReviewById,
    deleteReview,
    getAllReviews,
    getFlaggedReviews,
    updateReviewStatus,
    getReviewsByUser,
    hasUserPurchasedProduct,
    hasUserReviewedProduct,
    updateReview,
    getReviewedProductsByOrderAndUser,
};
