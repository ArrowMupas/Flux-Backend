const pool = require('../database/pool');

const createOffer = async (product_id, price, start, end) => {
    await pool.query(
        `INSERT INTO limited_offers (product_id, discounted_price, start_date, end_date)
         VALUES (?, ?, ?, ?)`,
        [product_id, price, start, end]
    );
};

const updateOffer = async (product_id, price, start, end) => {
    await pool.query(
        `UPDATE limited_offers
         SET discounted_price = ?, start_date = ?, end_date = ?
         WHERE product_id = ?`,
        [price, start, end, product_id]
    );
};

const deleteOffer = async (product_id) => {
    await pool.query(`DELETE FROM limited_offers WHERE product_id = ?`, [product_id]);
};

const getAllOffers = async () => {
    const [rows] = await pool.query(`
        SELECT product_id, discounted_price, start_date, end_date,
               CASE 
                 WHEN NOW() < start_date THEN 'upcoming'
                 WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
                 ELSE 'expired'
               END AS status
        FROM limited_offers
    `);
    return rows;
};

module.exports = {
    createOffer,
    updateOffer,
    deleteOffer,
    getAllOffers,
};
