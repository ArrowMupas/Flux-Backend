const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const adminUserModel = require('../models/adminUserModel');
const bcrypt = require('bcrypt');
const HttpError = require('../helpers/errorHelper');

const { logUserAction } = require('../helpers/smartActivityLogger');
const { ACTION_TYPES } = require('../helpers/activityLogHelper');

// Admin get users with optional filters
const getUsers = asyncHandler(async (req, res) => {
    const { role, is_active, is_verified } = req.query;

    const users = await adminUserModel.getUsers({ role, is_active, is_verified });
    if (!users || users.length === 0) {
        throw new HttpError(404, 'No users found');
    }

    return sendResponse(res, 200, 'Users fetched', users);
});

// Admin get users by ID
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await adminUserModel.getUserById(id);
    if (!user) {
        throw new HttpError(404, 'User not found');
    }
    return sendResponse(res, 200, 'User fetched', user);
});

// Admin update users
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email, address, contact_number } = req.body;

    // Get current user data for logging
    const currentUser = await adminUserModel.getUserById(id);
    if (!currentUser) {
        throw new HttpError(404, 'User not found');
    }

    const result = await adminUserModel.updateUser(id, username, email, address, contact_number);

    // 🎯 SIMPLE ONE-LINER LOGGING!
    await logUserAction({
        req,
        actionType: ACTION_TYPES.UPDATE_USER,
        userId: id,
        username,
        before: {
            username: currentUser.username,
            email: currentUser.email,
            address: currentUser.address,
            contact_number: currentUser.contact_number,
        },
        after: { username, email, address, contact_number },
    });

    return sendResponse(res, 200, 'User updated', result);
});

// Admin activate/deactivate user
const manageUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await adminUserModel.getUserById(id);
    if (!user) {
        throw new HttpError(404, 'User not found');
    }

    user.is_active = Boolean(user.is_active);

    if (user.role === 'admin' && is_active === false) {
        throw new HttpError(403, 'Cannot deactivate an admin user');
    }
    if (user.is_active === is_active) {
        throw new HttpError(400, `User is already ${is_active ? 'active' : 'inactive'}`);
    }

    await adminUserModel.manageUser(id, is_active);

    // SIMPLE ONE-LINER LOGGING!
    await logUserAction({
        req,
        actionType: is_active ? ACTION_TYPES.ACTIVATE_USER : ACTION_TYPES.DEACTIVATE_USER,
        userId: id,
        username: user.username,
        before: { is_active: user.is_active },
        after: { is_active },
        details: `User ${is_active ? 'activated' : 'deactivated'}`,
    });

    res.status(200).json({
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
});

// Admin create  user
const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    // Check for existing user
    const userExists = await adminUserModel.getUserByUsername(username);
    if (userExists) {
        throw new HttpError(400, 'Username already in use');
    }
    const emailExists = await adminUserModel.getUserByEmail(email);
    if (emailExists) {
        throw new HttpError(400, 'Email already in use');
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10); // Combines password with salt
    const user = await adminUserModel.createUser(username, email, hashedPassword, role);

    // SIMPLE ONE-LINER LOGGING!
    await logUserAction({
        req,
        actionType: ACTION_TYPES.CREATE_USER,
        userId: user.insertId || user.id,
        username,
        before: null,
        after: { username, email, role },
    });

    return sendResponse(res, 200, 'User created', user);
});

// POST /admin/users  – create many users at once
const createUsersWithDates = asyncHandler(async (req, res) => {
    const rawUsers = req.body;

    // 1️⃣ Ensure we actually received an array
    if (!Array.isArray(rawUsers) || rawUsers.length === 0) {
        throw new HttpError(400, 'Request body must be a non-empty array of users');
    }

    // 2️⃣ Check duplicates & hash passwords up-front
    const usersToInsert = [];

    for (const user of rawUsers) {
        const { username, email, password, role, created_at, updated_at } = user;

        // Duplicate?
        if (await adminUserModel.getUserByUsername(username)) {
            throw new HttpError(400, `User already exists: ${username}`);
        }

        usersToInsert.push({
            username,
            email,
            passwordHash: await bcrypt.hash(password, 10),
            role,
            createdAt: created_at, // rename to match model expectation
            updatedAt: updated_at,
        });
    }

    // 3️⃣ Bulk insert
    const insertedUsers = await adminUserModel.createUsersWithDates(usersToInsert);

    return sendResponse(res, 200, 'Users created with custom timestamps', insertedUsers);
});

module.exports = {
    getUserById,
    updateUser,
    manageUser,
    createUser,
    getUsers,
    createUsersWithDates,
};
