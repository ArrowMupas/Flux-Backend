const asyncHandler = require('express-async-handler');
const userModel = require('../models/userModel');
const entityExistHelper = require('../helpers/entityExistHelper');
const HttpError = require('../helpers/errorHelper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utilities/emailUtility');
const crypto = require('crypto');
require('dotenv').config();

// Register a user
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check for existing user
    const userExists = await userModel.getUserByUsername(username);
    if (userExists) {
        throw new HttpError(401, `User already exists`);
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10); // Combines password with salt
    const user = await userModel.createUser(username, email, hashedPassword);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await userModel.saveVerificationToken(user.id, verificationToken);

    const verificationLink = `${process.env.BASE_URL}/api/users/verify-email?token=${verificationToken}`;

    await sendEmail({
        to: email,
        subject: 'Verify your email',
        html: `
      <h2>Welcome, ${username}!</h2>
      <p>Please verify your email by clicking the button below:</p>
      <a href="${verificationLink}" style="background:#4CAF50;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Verify Email</a>
    `,
    });

    res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
    });
});

// Authenticate user
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await userModel.getUserByUsername(username);

    entityExistHelper(user, res, 404, 'User not found');

    if (!user.is_verified) {
        throw new HttpError(403, `Email not verified`);
    }

    // Check if user is active
    if (!user.is_active) {
        throw new HttpError(403, `Account is inactive`);
    }

    //Bcrypt authentication
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new HttpError(401, 'Invalid credentials');
    }

    await userModel.logUserLogin(user.id, user.username);

    // Generate JWT
    const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role_name },
        process.env.SECRET_KEY,
        { expiresIn: '1d' }
    );

    res.json({
        token,
    });
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const user = await userModel.getUserByVerificationToken(token);
    if (!user) throw new HttpError(400, 'Invalid or expired token');

    await userModel.verifyUser(user.id);
    await userModel.deleteVerificationToken(token);

    res.send('Email verified successfully! You can now log in.');
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new HttpError(400, 'Email is required');
    }

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

// Retrieve user data
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await userModel.getUserById(req.user.id);

    entityExistHelper(user, res, 404, 'User not found');

    res.json({
        id: user.id,
        role_name: user.role_name,
        username: user.username,
        email: user.email,
        address: user.address,
        contact_number: user.contact_number,
        created_at: user.created_at,
        updated_at: user.updated_at,
    });
});

// Update user
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
const resetUserPassword = asyncHandler(async (req, res) => {
    const { username, password, newPassword, confirmPassword } = req.body;

    const user = await userModel.getUserByUsername(username);

    entityExistHelper(user, res, 404, 'User not found');

    // Check if user is active
    if (!user.is_active) {
        throw new HttpError(403, `Account is inactive`);
    }

    // Bcrypt authentication
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new HttpError(401, `Invalid Credentials`);
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
        throw new HttpError(400, `New password must be different from the old password`);
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
        throw new HttpError(400, `New password do not match`);
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Combines password with salt
    userModel.resetUserPassword(user.id, hashedPassword);

    res.status(200).json({
        message: 'Password reset successful',
    });
});

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
    const { email, newPassword, confirmPassword } = req.body;

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

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
        throw new HttpError(400, `New password do not match`);
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
    getUserProfile,
    updateUser,
    resetUserPassword,
    verifyEmail,
    resendVerificationEmail,
    verifyResetToken,
    changeUserPassword,
    requestPasswordReset,
};
