const pool = require('../database/pool');

const addReview = async ({ user_id, product_id, rating, review_text }) => {
    await pool.query(
        `INSERT INTO product_reviews (user_id, product_id, rating, review_text)
         VALUES (?, ?, ?, ?)`,
        [user_id, product_id, rating, review_text]
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

module.exports = {
    addReview,
    getReviewsByProduct,
    deleteReview,
};
