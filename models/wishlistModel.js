const pool = require('../database/pool');

const addWishlistItem = async ({ user_id, product_id }) => {
    if (!user_id || !product_id) throw new Error('User ID and Product ID are required');

    let [wishlists] = await pool.query(`SELECT id FROM wishlists WHERE user_id = ?`, [user_id]);
    let wishlistId;

    if (wishlists.length === 0) {
        const [result] = await pool.query(`INSERT INTO wishlists (user_id) VALUES (?)`, [user_id]);
        wishlistId = result.insertId;
    } else {
        wishlistId = wishlists[0].id;
    }

    // Check if already in wishlist
    const [existing] = await pool.query(
        `SELECT id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?`,
        [wishlistId, product_id]
    );

    if (existing.length === 0) {
        // Insert wishlist item only if it doesn't exist
        await pool.query(
            `INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)`,
            [wishlistId, product_id]
        );
    }

    // Return updated wishlist count
    const [product] = await pool.query(`SELECT wishlist_count FROM products WHERE id = ?`, [product_id]);
    if (!product[0]) throw new Error('Product not found');

    return product[0].wishlist_count;
};

const removeWishlistItem = async ({ user_id, product_id }) => {
    if (!user_id || !product_id) throw new Error('User ID and Product ID are required');

    const [wishlists] = await pool.query(`SELECT id FROM wishlists WHERE user_id = ?`, [user_id]);
    if (wishlists.length === 0) return null;

    const wishlistId = wishlists[0].id;
    const [result] = await pool.query(
        `DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?`,
        [wishlistId, product_id]
    );

    if (result.affectedRows === 0) return null;

    const [product] = await pool.query(`SELECT wishlist_count FROM products WHERE id = ?`, [product_id]);
    return product[0].wishlist_count;
};

const getWishlistByUser = async (user_id) => {
    const [wishlists] = await pool.query(`SELECT id FROM wishlists WHERE user_id = ?`, [user_id]);
    if (wishlists.length === 0) return [];

    const wishlistId = wishlists[0].id;
    const [rows] = await pool.query(
        `SELECT wi.id AS wishlist_item_id, p.id AS product_id, p.name, p.price, p.image, p.description, p.wishlist_count
         FROM wishlist_items wi
         JOIN products p ON wi.product_id = p.id
         WHERE wi.wishlist_id = ?`,
        [wishlistId]
    );
    return rows;
};

const getAllWishlists = async () => {
    const [rows] = await pool.query(
        `SELECT w.id AS wishlist_id, u.id AS user_id, u.username, COUNT(wi.product_id) AS item_count
         FROM wishlists w
         JOIN users u ON w.user_id = u.id
         LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
         GROUP BY w.id`
    );
    return rows;
};

module.exports = {
    addWishlistItem,
    removeWishlistItem,
    getWishlistByUser,
    getAllWishlists,
};
