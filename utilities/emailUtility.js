const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
    if (transporter) return transporter;

    // Create Ethereal test account once
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    return transporter;
}

async function sendEmail({ to, subject, html }) {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
        from: '"Sauce Shop" <noreply@sauceshop.com>',
        to,
        subject,
        html,
    });

    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}

module.exports = {
    sendEmail,
};
