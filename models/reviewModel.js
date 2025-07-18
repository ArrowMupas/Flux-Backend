const pool = require('../database/pool');

const addReview = async ({ user_id, product_id, rating, review_text, order_id = null }) => {
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

module.exports = {
    addReview,
    getReviewsByProduct,
    deleteReview,
    getReviewedProductsByOrderAndUser,
};
