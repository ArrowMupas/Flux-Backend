const pool = require('../database/pool');
const SQL = require('sql-template-strings');

const updateUserLoyaltyProgress = async (userId) => {
    const [result] = await pool.query(SQL`
        INSERT INTO user_loyalty_progress (user_id, total_orders, last_updated)
        VALUES (${userId}, 1, NOW())
        ON DUPLICATE KEY UPDATE 
            total_orders = total_orders + 1,
            last_updated = NOW()
    `);
    return result;
};

const createloyaltyCoupon = async (couponData, connection = pool) => {
    const {
        code,
        description,
        discount_type,
        discount_value,
        is_active = 1,
        starts_at = null,
        expires_at = null,
        is_loyalty_reward = 1,
    } = couponData;

    const [result] = await connection.query(SQL`
    INSERT INTO coupons (
      code, description, discount_type, discount_value,
      is_active, starts_at, expires_at, is_loyalty_reward
    ) VALUES (
      ${code}, ${description}, ${discount_type}, ${discount_value},
      ${is_active}, ${starts_at}, ${expires_at}, ${is_loyalty_reward}
    )
  `);

    return result.insertId;
};

const getLoyaltyRewardByOrders = async (required_orders, connection = pool) => {
    const [rows] = await connection.query(SQL`
    SELECT * FROM loyalty_rewards WHERE required_orders = ${required_orders} LIMIT 1
  `);
    return rows[0];
};

const createLoyaltyReward = async (rewardData, connection = pool) => {
    const { required_orders, coupon_id, is_monthly = 0, active = 1 } = rewardData;

    const [result] = await connection.query(SQL`
    INSERT INTO loyalty_rewards (
      required_orders, coupon_id, is_monthly, active
    ) VALUES (
      ${required_orders}, ${coupon_id}, ${is_monthly}, ${active}
    )
  `);

    return result.insertId;
};

const updateLoyaltyRewardCoupon = async (rewardId, newCouponId, connection = pool) => {
    await connection.query(SQL`
    UPDATE loyalty_rewards
    SET coupon_id = ${newCouponId}, created_at = NOW()
    WHERE id = ${rewardId}
  `);
};

const getUserClaimedRewards = async (userId) => {
    const [rows] = await pool.query(SQL`
    SELECT 
      ucr.id AS claimed_id,
      ucr.reward_id,
      ucr.claimed_at,
      ucr.claimed_coupon_id,
      lr.required_orders,
      c.code AS coupon_code,
      c.discount_type,
      c.discount_value
    FROM user_claimed_rewards ucr
    JOIN loyalty_rewards lr ON lr.id = ucr.reward_id
    JOIN coupons c ON c.id = ucr.claimed_coupon_id
    WHERE ucr.user_id = ${userId}
    ORDER BY ucr.claimed_at DESC
  `);

    return rows;
};

const getLoyaltyRewardsUpTo8 = async () => {
    const [rows] = await pool.query(SQL`
    WITH orders AS (
      SELECT 1 AS order_num UNION ALL
      SELECT 2 UNION ALL
      SELECT 3 UNION ALL
      SELECT 4 UNION ALL
      SELECT 5 UNION ALL
      SELECT 6 UNION ALL
      SELECT 7 UNION ALL
      SELECT 8
    )
    SELECT
      o.order_num AS required_orders,
      lr.id AS reward_id,
      lr.coupon_id,
      lr.is_monthly,
      lr.active,
      lr.created_at,
      c.code AS coupon_code,
      c.discount_type,
      c.discount_value
    FROM orders o
    LEFT JOIN loyalty_rewards lr
      ON lr.required_orders = o.order_num
    LEFT JOIN coupons c
      ON lr.coupon_id = c.id
    ORDER BY o.order_num
  `);

    return rows;
};

module.exports = {
    updateUserLoyaltyProgress,
    createloyaltyCoupon,
    getLoyaltyRewardByOrders,
    createLoyaltyReward,
    updateLoyaltyRewardCoupon,
    getUserClaimedRewards,
    getLoyaltyRewardsUpTo8,
};
