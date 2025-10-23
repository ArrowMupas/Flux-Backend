const asyncHandler = require('express-async-handler');
const loyaltyService = require('../services/loyaltyService');
const sendResponse = require('../middlewares/responseMiddleware');

const createLoyaltyReward = asyncHandler(async (req, res) => {
    const result = await loyaltyService.createCouponForLoyalty(req.body);
    return sendResponse(res, 201, 'Coupon created successfully', result);
});

const FetchLoyaltyProgress = asyncHandler(async (req, res) => {
    const result = await loyaltyService.getLoyaltyProgress(req.user.id);
    return sendResponse(res, 200, 'Loyalty Progress Fetched Succesfully', result);
});

const ClaimLoyaltyReward = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const rewardId = parseInt(req.params.rewardId, 10);

    const result = await loyaltyService.claimLoyaltyReward(userId, rewardId);
    return sendResponse(res, 200, 'Loyalty Reward Claimed Succesfully', result);
});

const FetchUserRewards = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await loyaltyService.getUserClaimedReward(userId);
    return sendResponse(res, 200, 'User  Reward Fetched Succesfully', result);
});

const FetchCurrentRewardsAdmin = asyncHandler(async (req, res) => {
    const result = await loyaltyService.getCurrentRewardsAdmin();
    return sendResponse(res, 201, 'Rewards fetched succesfully', result);
});

module.exports = {
    createLoyaltyReward,
    FetchLoyaltyProgress,
    ClaimLoyaltyReward,
    FetchUserRewards,
    FetchCurrentRewardsAdmin,
};
