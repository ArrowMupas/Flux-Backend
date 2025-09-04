const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const adminUserModel = require('../models/adminUserModel');
const bcrypt = require('bcrypt');
const HttpError = require('../helpers/errorHelper');

// Admin get users with optional filters
const getUsers = asyncHandler(async (req, res) => {
    const { role, is_active, is_verified } = req.query;

    const users = await adminUserModel.getUsers({ role, is_active, is_verified });
    if (!users || users.length === 0) {
        throw new HttpError(404, 'No users found');
    }

    return sendResponse(res, 200, 'Users fetched', users);
});

const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await adminUserModel.getUserById(id);
    if (!user) {
        throw new HttpError(404, 'User not found');
    }
    return sendResponse(res, 200, 'User fetched', user);
});

const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email, address, contact_number } = req.body;

    // Get current user data for logging
    const currentUser = await adminUserModel.getUserById(id);
    if (!currentUser) {
        throw new HttpError(404, 'User not found');
    }

    const result = await adminUserModel.updateUser(id, username, email, address, contact_number);

    res.locals.auditLog = {
        entity_id: id,
        entity_name: username,
        description: `Updated user "${username}"`,
        before_data: {
            username: currentUser.username,
            email: currentUser.email,
            address: currentUser.address,
            contact_number: currentUser.contact_number,
        },
        after_data: { username, email, address, contact_number },
    };

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

    res.locals.auditLog = {
        entity_id: id,
        entity_name: user.username,
        description: `Set user "${user.username}" to ${is_active ? 'active' : 'inactive'}`,
        before_data: { is_active: user.is_active },
        after_data: { is_active: Boolean(is_active) },
    };

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

    const hashedPassword = await bcrypt.hash(password, 10); // Combines password with salt
    const user = await adminUserModel.createUser(username, email, hashedPassword, role);

    res.locals.auditLog = {
        entity_id: user.insertId || user.id,
        entity_name: username,
        description: `Created new user "${username}"`,
        after_data: { username, email, role },
    };

    return sendResponse(res, 200, 'User created', user);
});

module.exports = {
    getUserById,
    updateUser,
    manageUser,
    createUser,
    getUsers,
};
