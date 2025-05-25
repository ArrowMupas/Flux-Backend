const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const limitedOfferModel = require('../models/limitedOfferModel');

const createLimitedOffer = asyncHandler(async (req, res) => {
    const { product_id, discounted_price, start_date, end_date } = req.body;
    if (!product_id || !discounted_price || !start_date || !end_date) {
        throw new HttpError(400, 'All fields are required');
    }

    await limitedOfferModel.createOffer(product_id, discounted_price, start_date, end_date);
    return sendResponse(res, 201, 'Limited offer created.');
});

const updateLimitedOffer = asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    const { discounted_price, start_date, end_date } = req.body;

    await limitedOfferModel.updateOffer(product_id, discounted_price, start_date, end_date);
    return sendResponse(res, 200, 'Limited offer updated.');
});

const deleteLimitedOffer = asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    await limitedOfferModel.deleteOffer(product_id);
    return sendResponse(res, 200, 'Limited offer deleted.');
});

const getActiveLimitedOffers = asyncHandler(async (req, res) => {
    const offers = await limitedOfferModel.getAllOffers();
    return sendResponse(res, 200, 'All limited offers retrieved.', offers);
});

module.exports = {
    createLimitedOffer,
    updateLimitedOffer,
    deleteLimitedOffer,
    getActiveLimitedOffers,
};
