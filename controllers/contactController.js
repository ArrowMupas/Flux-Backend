const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const contactModel = require('../models/contactModel');
const emailUtil = require('../utilities/emailUtility');
const HttpError = require('../helpers/errorHelper');

// Create contact inquiry (public)
const createContact = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        throw new HttpError(400, 'All fields are required.');
    }

    const contactId = await contactModel.createContact({ name, email, message });

    try {
        await emailUtil.sendEmail({
            to: process.env.GMAIL_USER,
            subject: 'New Contact Inquiry',
            html: `
            <h3>New Inquiry Received</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `,
        });
    } catch (err) {
        console.error('Failed to send admin email:', err.message);
    }

    try {
        await emailUtil.sendEmail({
            to: email,
            subject: 'Thanks for contacting ALAS Delis & Hot Sauce!',
            html: `
            <h3>Hello ${name},</h3>
            <p>Thanks for reaching out to ALAS Delis & Hot Sauce.</p>
            <p>We received your message and will reply as soon as possible.</p>
            <p>— The ALAS Team 🌶️</p>
        `,
        });
    } catch (err) {
        console.error('Failed to send confirmation email:', err.message);
    }

    return sendResponse(res, 201, 'Inquiry submitted successfully', { id: contactId });
});

// Get all inquiries (admin)
const getAllContacts = asyncHandler(async (req, res) => {
    const contacts = await contactModel.getAllContacts();
    return sendResponse(res, 200, 'Contacts retrieved', contacts);
});

// Get single inquiry (admin)
const getContactById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await contactModel.getContactById(id);
    if (!contact) throw new HttpError(404, 'Contact not found');
    return sendResponse(res, 200, 'Contact retrieved', contact);
});

// Delete inquiry (admin)
const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await contactModel.deleteContact(id);
    return sendResponse(res, 200, 'Contact deleted');
});

module.exports = {
    createContact,
    getAllContacts,
    getContactById,
    deleteContact,
};
