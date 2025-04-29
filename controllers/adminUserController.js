const adminUserModel = require('../models/adminUserModel');
const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');
const entityExistHelper = require('../helpers/entityExistHelper');

// Admin get all users
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await adminUserModel.getAllUsers();
    return sendResponse(res, 200, 'All users fetched', users);
});

// Admin get users by ID
const getUserById = asyncHandler(async (req, res) => {
    const user = await adminUserModel.getUserById(req.params.id);
    entityExistHelper(user, res, 404, 'User not found');

    return sendResponse(res, 200, 'User fetched', user);
});

// Admin update users
const updateUser = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { username, email, address, contact_number, role_id } = req.body;

    const user = await adminUserModel.getUserById(id);
    entityExistHelper(user, res, 404, 'User not found');

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
        return res.status(400).json({ message: 'is_active must be a boolean (true or false)' });
    }

    const result = await adminUserModel.manageUser(id, is_active);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    manageUser,
};
