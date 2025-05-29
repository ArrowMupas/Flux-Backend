const pool = require('../database/pool');

const getAllSpecialOffers = async () => {
    const [rows] = await pool.query(`SELECT * FROM special_offers`);
    return rows;
};

const createSpecialOffer = async (data) => {
    const {
        product_id,
        rule_type,
        x_quantity,
        y_quantity = 0,
        fixed_price = null,
        start_date,
        end_date,
    } = data;

    await pool.query(
        `
        INSERT INTO special_offers
        (product_id, rule_type, x_quantity, y_quantity, fixed_price, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [product_id, rule_type, x_quantity, y_quantity, fixed_price, start_date, end_date]
    );
};

const updateSpecialOffer = async (id, data) => {
    const {
        product_id,
        rule_type,
        x_quantity,
        y_quantity = 0,
        fixed_price = null,
        start_date,
        end_date,
    } = data;

    await pool.query(
        `
        UPDATE special_offers
        SET product_id = ?, rule_type = ?, x_quantity = ?, y_quantity = ?, fixed_price = ?, start_date = ?, end_date = ?
        WHERE offer_id = ?`,
        [product_id, rule_type, x_quantity, y_quantity, fixed_price, start_date, end_date, id]
    );
};

const deleteSpecialOffer = async (id) => {
    await pool.query(`DELETE FROM special_offers WHERE offer_id = ?`, [id]);
};

const getActiveSpecialOffer = async (productId) => {
    const [rows] = await pool.query(
        `
        SELECT * FROM special_offers
        WHERE product_id = ?
          AND NOW() BETWEEN start_date AND end_date
        LIMIT 1`,
        [productId]
    );
    return rows[0] || null;
};

module.exports = {
    getAllSpecialOffers,
    createSpecialOffer,
    updateSpecialOffer,
    deleteSpecialOffer,
    getActiveSpecialOffer,
};
