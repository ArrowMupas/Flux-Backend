const specialOfferModel = require('../models/specialOfferModel');
const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const HttpError = require('../helpers/errorHelper');

const getAllSpecialOffers = asyncHandler(async (req, res) => {
    const offers = await specialOfferModel.getAllSpecialOffers();
    return sendResponse(res, 200, 'Special offers fetched.', offers);
});

const createSpecialOffer = asyncHandler(async (req, res) => {
    const data = req.body;

    if (!data.product_id || !data.rule_type || !data.x_quantity || !data.end_date) {
        throw new HttpError(400, 'Missing required fields');
    }

    await specialOfferModel.createSpecialOffer(data);
    return sendResponse(res, 201, 'Special offer created.');
});

const updateSpecialOffer = asyncHandler(async (req, res) => {
    const offerId = req.params.id;
    const data = req.body;

    await specialOfferModel.updateSpecialOffer(offerId, data);
    return sendResponse(res, 200, 'Special offer updated.');
});

const deleteSpecialOffer = asyncHandler(async (req, res) => {
    const offerId = req.params.id;

    await specialOfferModel.deleteSpecialOffer(offerId);
    return sendResponse(res, 200, 'Special offer deleted.');
});

module.exports = {
    getAllSpecialOffers,
    createSpecialOffer,
    updateSpecialOffer,
    deleteSpecialOffer,
};
