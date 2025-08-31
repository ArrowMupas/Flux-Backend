const asyncHandler = require('express-async-handler');
const userModel = require('../models/userModel');
const entityExistHelper = require('../helpers/entityExistHelper');
const HttpError = require('../helpers/errorHelper');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utilities/emailUtility');
const userService = require('../services/userService');
const crypto = require('crypto');
require('dotenv').config();

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const result = await userService.registerLogic({ username, email, password });

    res.status(201).json(result);
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const { token } = await userService.loginLogic(username, password);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ token });
});

const logoutUser = asyncHandler(async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({ message: 'Logged out successfully' });
});

const getUserProfile = asyncHandler(async (req, res) => {
    const userData = await userService.getProfileLogic(req.user.id);
    res.json(userData);
});

const updateUser = asyncHandler(async (req, res) => {
    const { username, address, contact_number } = req.body;

    const updatedUser = await userModel.updateUser(req.user.id, {
        username,
        address,
        contact_number,
    });

    res.status(200).json(updatedUser);
});

// Reset user password
const updateUserPassword = asyncHandler(async (req, res) => {
    const { password, newPassword } = req.body;

    await userService.updatePasswordLogic(req.user.id, password, newPassword);

    res.status(200).json({
        message: 'Password updated successfully',
    });
});

// To be finished and refactor.
// Verify user email
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    const user = await userModel.getUserByVerificationToken(token);
    if (!user) {
        throw new HttpError(400, 'Invalid or expired token');
    }

    await userModel.verifyUser(user.id);
    await userModel.deleteVerificationToken(token);

    res.send('Email verified successfully! You can now log in.');
});

// Resend verification email
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Find user by email
    const user = await userModel.getUserByEmail(email);
    if (!user) {
        throw new HttpError(404, 'User not found');
    }

    // Check if already verified
    if (user.is_verified) {
        return res.status(200).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Save new verification token to DB
    await userModel.saveVerificationToken(user.id, verificationToken);

    // Construct verification link
    const verificationLink = `${process.env.BASE_URL}/api/users/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendEmail({
        to: email,
        subject: 'Resend: Verify your email',
        html: `
      <h2>Hello, ${user.username}!</h2>
      <p>You requested to resend the verification email. Please verify your email by clicking the button below:</p>
      <a href="${verificationLink}" style="background:#4CAF50;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Verify Email</a>
    `,
    });

    res.status(200).json({ message: 'Verification email resent' });
});

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await userModel.getUserByEmail(email);
    if (!user) throw new HttpError(404, 'User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await userModel.savePasswordResetToken(user.id, token, expiresAt);

    const resetLink = `${process.env.BASE_URL}/api/users/verify-password-reset?token=${token}`;
    await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `<p>Click the link below to reset your password:</p>
            <a href="${resetLink}" style="background:#4CAF50;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Reset Password</a>
            <p>This link expires in 1 hour.</p>`,
    });

    res.status(200).json({ message: 'Password reset email sent' });
});

// Verify password reset token
const verifyResetToken = asyncHandler(async (req, res) => {
    const { token } = req.query;

    const user = await userModel.getUserByPasswordResetToken(token);
    if (!user || user.expires_at < new Date()) {
        throw new HttpError(400, 'Invalid or expired token');
    }

    res.send('Password reset verified');
});

// Reset user password
const changeUserPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;

    const user = await userModel.getUserByEmail(email);

    entityExistHelper(user, res, 404, 'User not found');

    // Check if user is active
    if (!user.is_active) {
        throw new HttpError(403, `Account is inactive`);
    }

    const hasReset = await userModel.hasActivePasswordResetRequest(user.id);
    if (!hasReset) {
        throw new HttpError(403, `Password reset not verified`);
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Combines password with salt
    userModel.resetUserPassword(user.id, hashedPassword);

    await userModel.deletePasswordResetToken(user.id);

    res.status(200).json({
        message: 'Password reset successful',
    });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUser,
    updateUserPassword,
    verifyEmail,
    resendVerificationEmail,
    verifyResetToken,
    changeUserPassword,
    requestPasswordReset,
};
