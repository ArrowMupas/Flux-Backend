const express = require('express');
const router = express.Router();
const specialOfferController = require('../controllers/specialOfferController');

router.get('/', specialOfferController.getAllSpecialOffers);
router.post('/', specialOfferController.createSpecialOffer);
router.put('/:id', specialOfferController.updateSpecialOffer);
router.delete('/:id', specialOfferController.deleteSpecialOffer);

module.exports = router;
