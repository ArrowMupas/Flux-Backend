const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const adminUserModel = require('../models/adminUserModel');
const entityExistHelper = require('../helpers/entityExistHelper');
const bcrypt = require('bcrypt');
const HttpError = require('../helpers/errorHelper');

// Admin get users with optional filters
const getUsers = asyncHandler(async (req, res) => {
    const { role, is_active, is_verified } = req.query;

    const users = await adminUserModel.getUsers({ role, is_active, is_verified });
    return sendResponse(res, 200, 'Users fetched', users);
});

// Admin get users by ID
const getUserById = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const user = await adminUserModel.getUserById(id);
    if (!user) throw new HttpError(404, `No user found with ID: ${id}`);
    return sendResponse(res, 200, 'User fetched', user);
});

// Admin update users
const updateUser = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { username, email, address, contact_number, role_id } = req.body;

    const user = await adminUserModel.getUserById(id);
    if (!user) throw new HttpError(404, `No user found with ID: ${id}`);

    const result = await adminUserModel.updateUser(
        id,
        username,
        email,
        address,
        contact_number,
        role_id
    );

    return sendResponse(res, 200, 'User updated', result);
});

// Admin activate/deactivate user
const manageUser = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { is_active } = req.body;

    // Make sure request is true or false
    if (typeof is_active !== 'boolean') {
        throw new HttpError(400, 'Value must be true or false');
    }

    const result = await adminUserModel.manageUser(id, is_active);

    if (result.affectedRows === 0) {
        throw new HttpError(404, `No user found with ID: ${id}`);
    }

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
        throw new HttpError(400, 'User already exists');
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10); // Combines password with salt
    const user = await adminUserModel.createUser(username, email, hashedPassword, role);

    return sendResponse(res, 200, 'User created', user);
});

module.exports = {
    getUserById,
    updateUser,
    manageUser,
    createUser,
    getUsers,
};
