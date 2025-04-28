const adminUserModel = require('../models/adminUserModel');
const asyncHandler = require('express-async-handler');
const sendResponse = require('../middlewares/responseMiddleware');

// Function to get all users
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await adminUserModel.getAllUsers();

    return sendResponse(res, 200, 'All users fetched', users);
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await adminUserModel.getUserById(req.params.id);

    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    return sendResponse(res, 200, 'User fetched', user);
});

const updateUser = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { username, email, address, contact_number, role_id } = req.body;

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

const manageUser = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { is_active } = req.body;

    const result = await adminUserModel.manageUser(id, is_active);

    if (result.affectedRows === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
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
