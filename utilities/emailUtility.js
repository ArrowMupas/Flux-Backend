const nodemailer = require('nodemailer');

let transporter;

// Function to create and return a nodemailer transporter
async function getTransporter() {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    return transporter;
}

// Function to send an email
async function sendEmail({ to, subject, html }) {
    const transporter = await getTransporter();

    await transporter.sendMail({
        from: `"Alas Delis Hot Sauce" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });
}

module.exports = {
    sendEmail,
};
