const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const limitedOfferController = require('../controllers/limitedOfferController');

// Admin routes (no token validation for now)
router.post('/', limitedOfferController.createLimitedOffer);
router.put('/:product_id', limitedOfferController.updateLimitedOffer);
router.delete('/:product_id', limitedOfferController.deleteLimitedOffer);

// Public route
router.get('/', limitedOfferController.getActiveLimitedOffers);

module.exports = router;
