const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    note: { type: String, required: true, trim: true },
    ip: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactSchema);
