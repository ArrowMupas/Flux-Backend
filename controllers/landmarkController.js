const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const landmarkModel = require('../models/landmarkModel');
const { reverseGeocode } = require('../helpers/geocodeHelper');

// Create or update landmark
const createOrUpdateLandmark = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { latitude, longitude, label } = req.body;

  if (!latitude || !longitude) {
    return sendResponse(res, 400, 'Latitude and longitude are required');
  }

  const address = await reverseGeocode(latitude, longitude);
  await landmarkModel.upsertLandmark(userId, latitude, longitude, address, label || null);

  return sendResponse(res, 200, 'Landmark saved successfully', { address });
});

// Get landmark
const getLandmark = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const landmark = await landmarkModel.getLandmarkByUser(userId);

  if (!landmark) {
    return sendResponse(res, 404, 'No landmark found', null);
  }

  return sendResponse(res, 200, 'Landmark retrieved', landmark);
});

module.exports = {
  createOrUpdateLandmark,
  getLandmark,
};
