const fs = require('fs');
const path = require('path');

function getVerificationEmail(username, verificationLink) {
    const templatePath = path.join(__dirname, 'verifyEmail.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    template = template
        .replace(/{{username}}/g, username)
        .replace(/{{verificationLink}}/g, verificationLink)
        .replace(/{{year}}/g, new Date().getFullYear());

    return template;
}

module.exports = getVerificationEmail;
