const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendEmail } = require('../utilities/emailUtility');
const verificationEmail = require('../helpers/verificationEmailTemplate');
const { ensureExist, ensureNotExist } = require('../helpers/existenceHelper');
const HttpError = require('../helpers/errorHelper');
const logger = require('../utilities/logger');
const { getCache, setCache } = require('../utilities/cache');

const registerLogic = async ({ username, email, password }) => {
    const userExists = await userModel.getUserByUsername(username);
    ensureNotExist(userExists, 401, `${username} is already taken`);

    const normalizedEmail = email.trim().toLowerCase();

    const emailExists = await userModel.getUserByEmail(normalizedEmail);
    ensureNotExist(emailExists, 401, `${email} is already taken`);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser(username, normalizedEmail, hashedPassword);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await userModel.saveVerificationToken(user.id, verificationToken);

    const verificationLink = `${process.env.BASE_URL}/api/users/verify-email?token=${verificationToken}`;
    sendEmail({
        to: normalizedEmail,
        subject: 'Verify your email',
        html: verificationEmail(username, verificationLink),
    }).catch((err) => {
        console.error('Error sending verification email:', err);
    });

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        message: 'User created successfully. Verification email will be sent.',
    };
};

const loginLogic = async (username, password) => {
    const user = await userModel.getUserByUsername(username);
    ensureExist(user, 404, `User ${username} not found`);

    if (!user.is_active) {
        throw new HttpError(403, `Account is inactive`);
    }

    if (!user.is_verified) {
        throw new HttpError(403, `Email not verified`);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new HttpError(401, 'Invalid credentials');
    }

    logger.info('login', {
        userId: user.id,
        username: user.username,
        role: user.role_name,
    });

    if (!process.env.SECRET_KEY) {
        throw new Error('SECRET_KEY environment variable is not defined.');
    }

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role_name,
        },
        process.env.SECRET_KEY,
        { expiresIn: '1d' }
    );

    return { token };
};

const getProfileLogic = async (userId) => {
    const cachedProfile = getCache(userId);
    if (cachedProfile) return cachedProfile;

    const user = await userModel.getUserById(userId);
    ensureExist(user, 404, `User with ID: ${userId} not found`);

    if (!user.is_active) {
        throw new HttpError(403, 'Account is inactive');
    }

    const profileData = {
        id: user.id,
        role_name: user.role_name,
        username: user.username,
        email: user.email,
        address: user.address,
        contact_number: user.contact_number,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };

    setCache(userId, profileData, 900);

    return profileData;
};

const updatePasswordLogic = async (userId, password, newPassword) => {
    const user = await userModel.getUserById(userId);

    ensureExist(user, 404, `User with ID: ${userId} not found`);

    if (!user.is_active) {
        throw new HttpError(403, 'Account is inactive');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new HttpError(401, 'Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
        throw new HttpError(400, 'New password must be different from the current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.resetUserPassword(user.id, hashedPassword);
};

module.exports = {
    registerLogic,
    loginLogic,
    getProfileLogic,
    updatePasswordLogic,
};
