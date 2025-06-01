const pool = require('../database/pool');

const getAllCoupons = async () => {
    const [rows] = await pool.query(`SELECT * FROM coupons`);
    return rows;
};

const createCoupon = async (data) => {
    const { code, description, type, amount, is_active = true, start_date, end_date } = data;

    await pool.query(
        `
    INSERT INTO coupons (code, description, type, amount, is_active, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [code, description, type, amount, is_active, start_date, end_date]
    );
};

const updateCoupon = async (id, data) => {
    const { code, description, type, amount, is_active = true, start_date, end_date } = data;

    await pool.query(
        `
    UPDATE coupons SET code = ?, description = ?, type = ?, amount = ?, 
    is_active = ?, start_date = ?, end_date = ?
    WHERE coupon_id = ?`,
        [code, description, type, amount, is_active, start_date, end_date, id]
    );
};

const deleteCoupon = async (id) => {
    await pool.query(`DELETE FROM coupons WHERE coupon_id = ?`, [id]);
};

const findValidCoupon = async (code) => {
    const [rows] = await pool.query(
        `
    SELECT * FROM coupons
    WHERE code = ?
      AND is_active = TRUE
      AND NOW() BETWEEN start_date AND end_date
    LIMIT 1`,
        [code]
    );

    return rows[0] || null;
};

module.exports = {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    findValidCoupon,
};
