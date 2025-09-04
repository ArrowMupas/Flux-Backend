const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Public API
router.post('/', contactController.createContact);

// Admin API
router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContactById);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
