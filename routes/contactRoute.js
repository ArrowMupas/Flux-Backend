// routes/contactRoute.js
const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');
const { saveContact, getAllContacts } = require('../controllers/contactController');

router.use(generalLimiter);

router.post('/', saveContact);
router.get('/', getAllContacts);

module.exports = router;
