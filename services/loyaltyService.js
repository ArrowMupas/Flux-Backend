const couponModel = require('../models/couponModel');
const loyaltyModel = require('../models/loyaltyModel');
const HttpError = require('../helpers/errorHelper');
const pool = require('../database/pool');
const SQL = require('sql-template-strings');

const createCouponForLoyalty = async (data) => {
    const { code, description, discount_type, discount_value, required_orders } = data;

    if (!code || !discount_type || !discount_value) {
        throw new HttpError(400, 'Required fields: code, discount_type, discount_value');
    }

    // Check for existing code
    const existing = await couponModel.getCouponByCode(code);
    if (existing) {
        throw new HttpError(409, 'Coupon code already exists');
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const newCouponId = await loyaltyModel.createloyaltyCoupon(
            {
                code,
                description,
                discount_type,
                discount_value,
            },
            connection
        );

        const existingReward = await loyaltyModel.getLoyaltyRewardByOrders(required_orders, connection);

        let rewardId;

        if (existingReward) {
            // ✅ Step 3a: Update the existing reward's coupon_id
            await loyaltyModel.updateLoyaltyRewardCoupon(existingReward.id, newCouponId, connection);
            rewardId = existingReward.id;
        } else {
            // ✅ Step 3b: Create a new reward if none exists
            const newRewardId = await loyaltyModel.createLoyaltyReward(
                {
                    required_orders,
                    coupon_id: newCouponId,
                    is_monthly: 0,
                },
                connection
            );
            rewardId = newRewardId;
        }
        await connection.commit();
        return { couponId: newCouponId, rewardId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// I know this is not standard but I just wanna end it all
const getLoyaltyProgress = async (userId) => {
    // Get user's total orders (defaults to 0 if not found)
    const [userProgress] = await pool.query(SQL`
      SELECT total_orders
      FROM user_loyalty_progress
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    const total_orders = userProgress.length ? userProgress[0].total_orders : 0;

    // Get all loyalty rewards (active ones)
    const [rewards] = await pool.query(SQL`
      SELECT id, required_orders
      FROM loyalty_rewards
      WHERE active = 1
      ORDER BY required_orders ASC
    `);

    // Get which rewards the user has already claimed
    const [claimed] = await pool.query(SQL`
      SELECT reward_id
      FROM user_claimed_rewards
      WHERE user_id = ${userId}
    `);

    const claimedIds = claimed.map((r) => r.reward_id);

    // Build reward status list
    const rewardStatuses = rewards.map((reward) => {
        let status = 'locked';

        if (claimedIds.includes(reward.id)) {
            status = 'claimed';
        } else if (total_orders >= reward.required_orders) {
            status = 'claimable';
        }

        return {
            id: reward.id,
            required_orders: reward.required_orders,
            status,
        };
    });

    // 5️⃣ Respond
    return {
        total_orders,
        rewards: rewardStatuses,
    };
};

const claimLoyaltyReward = async (userId, rewardId) => {
    const connection = await pool.getConnection();

    await connection.beginTransaction();

    // 1️Get reward info (and its coupon)
    const [rewardRows] = await connection.query(SQL`
      SELECT lr.id, lr.required_orders, lr.coupon_id, c.code, c.discount_type, c.discount_value
      FROM loyalty_rewards lr
      JOIN coupons c ON lr.coupon_id = c.id
      WHERE lr.id = ${rewardId} AND lr.active = 1
      LIMIT 1
    `);

    if (!rewardRows.length) {
        throw new HttpError(404, 'Reward not found or inactive');
    }

    const reward = rewardRows[0];

    // Get user progress
    const [progressRows] = await connection.query(SQL`
      SELECT total_orders
      FROM user_loyalty_progress
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    const total_orders = progressRows.length ? progressRows[0].total_orders : 0;

    if (total_orders < reward.required_orders) {
        throw new HttpError(400, 'You have not reached the required number of orders to claim this reward');
    }

    // Check if user already claimed this reward
    const [claimedRows] = await connection.query(SQL`
      SELECT id FROM user_claimed_rewards
      WHERE user_id = ${userId} AND reward_id = ${rewardId}
      LIMIT 1
    `);

    if (claimedRows.length) {
        throw new HttpError(409, 'You have already claimed this reward');
    }

    // Insert into claimed rewards
    await connection.query(SQL`
    INSERT INTO user_claimed_rewards (user_id, reward_id, claimed_coupon_id)
    VALUES (${userId}, ${rewardId}, ${reward.coupon_id})
  `);

    await connection.commit();
    connection.release();

    // Respond with coupon details
    return {
        reward_id: reward.id,
        coupon: {
            discount_type: reward.discount_type,
            discount_value: reward.discount_value,
        },
    };
};

const getUserClaimedReward = async (userId) => {
    return await loyaltyModel.getUserClaimedRewards(userId);
};

module.exports = {
    createCouponForLoyalty,
    getLoyaltyProgress,
    claimLoyaltyReward,
    getUserClaimedReward,
};
