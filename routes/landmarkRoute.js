const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const authorizeAccess = require('../middlewares/accessMiddleware');
const landmarkController = require('../controllers/landmarkController');

router.use(verifyToken);

// Get saved landmark
router.get('/', landmarkController.getLandmark);

// Create or update landmark
router.post('/', landmarkController.createOrUpdateLandmark);

module.exports = router;
