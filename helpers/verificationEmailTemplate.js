module.exports = (username, verificationLink) => `
    <h2>Welcome, ${username}!</h2>
    <p>Please verify your email by clicking the button below:</p>
    <a href="${verificationLink}" style="background:#4CAF50;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Verify Email</a>
`;
