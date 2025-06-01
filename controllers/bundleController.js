const bundleModel = require('../models/bundleModel');
const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const HttpError = require('../helpers/errorHelper');
const { bundleSchema } = require('../validations/bundleValidation');

const getAllBundles = asyncHandler(async (req, res) => {
    const bundles = await bundleModel.getAllBundles();
    return sendResponse(res, 200, 'Bundles fetched', bundles);
});

const getBundleById = asyncHandler(async (req, res) => {
    const bundle = await bundleModel.getBundleById(req.params.id);
    if (!bundle) throw new HttpError(404, 'Bundle not found');
    return sendResponse(res, 200, 'Bundle fetched', bundle);
});

const createBundle = asyncHandler(async (req, res) => {
    const { error, value } = bundleSchema.validate(req.body);
    if (error) throw new HttpError(400, error.details[0].message);

    const bundleId = await bundleModel.createBundle(value);
    return sendResponse(res, 201, 'Bundle created', { bundleId });
});

const updateBundle = asyncHandler(async (req, res) => {
    const { error, value } = bundleSchema.validate(req.body);
    if (error) throw new HttpError(400, error.details[0].message);

    await bundleModel.updateBundle(req.params.id, value);
    return sendResponse(res, 200, 'Bundle updated');
});

const deleteBundle = asyncHandler(async (req, res) => {
    await bundleModel.deleteBundle(req.params.id);
    return sendResponse(res, 200, 'Bundle deleted');
});

module.exports = {
    getAllBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
};
