// routes/contactRoute.js
const express = require('express');
const router = express.Router();
const Contact = require('../models/contactModel');
const { generalLimiter } = require('../middlewares/rateLimiterMiddleware');

router.use(generalLimiter);

router.post('/', async (req, res) => {
    try {
        const contact = new Contact({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            subject: req.body.subject,
            note: req.body.note,
            ip: req.ip,
        });

        await contact.save();
        res.status(201).json({ message: 'Contact saved!', id: contact._id });
    } catch (err) {
        console.error('Error saving contact:', err);
        res.status(500).json({ error: 'Failed to save contact' });
    }
});

module.exports = router;
