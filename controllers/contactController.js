const Contact = require('../models/contactModel');

const saveContact = async (req, res) => {
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
};

const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json(contacts);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
};

module.exports = { saveContact, getAllContacts };
