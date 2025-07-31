const pool = require('../database/pool');

const insertCoupon = async (coupon) => {
    const {
        code,
        description,
        discount_type,
        discount_value,
        is_active,
        starts_at,
        expires_at,
        usage_limit,
        per_user_limit,
    } = coupon;

    const [result] = await pool.execute(
        `INSERT INTO coupons (
      code, description, discount_type, discount_value,
      is_active, starts_at, expires_at, usage_limit, per_user_limit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            code,
            description || null,
            discount_type,
            discount_value,
            is_active,
            starts_at || null,
            expires_at || null,
            usage_limit || null,
            per_user_limit || null,
        ]
    );

    return result.insertId;
};

const getCouponById = async (id) => {
    const [rows] = await pool.execute('SELECT * FROM coupons WHERE id = ?', [id]);
    return rows[0];
};

const getCouponByCode = async (code) => {
    const [rows] = await pool.execute('SELECT * FROM coupons WHERE code = ?', [code]);
    return rows[0];
};

const incrementUsage = async (code, connection = pool) => {
    await connection.query(`UPDATE coupons SET times_used = times_used + 1 WHERE code = ?`, [code]);
};

const logUserCouponUsage = async (userId, couponCode, connection = pool) => {
    await connection.query(`INSERT INTO coupon_usages (user_id, coupon_code) VALUES (?, ?)`, [
        userId,
        couponCode,
    ]);
};

const getUserCouponUsageCount = async (userId, couponCode) => {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS usage_count FROM coupon_usages WHERE user_id = ? AND coupon_code = ?`,
        [userId, couponCode]
    );
    return rows[0]?.usage_count || 0;
};

module.exports = {
    insertCoupon,
    getCouponById,
    getCouponByCode,
    incrementUsage,
    logUserCouponUsage,
    getUserCouponUsageCount,
};
