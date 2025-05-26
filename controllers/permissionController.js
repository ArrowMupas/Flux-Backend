const asyncHandler = require('express-async-handler');
const permissionModel = require('../models/permissionModel');
const sendResponse = require('../middlewares/responseMiddleware');
const HttpError = require('../helpers/errorHelper');

const updateStaffPermissions = asyncHandler(async (req, res) => {
    const staffId = req.params.id;
    const { permissions } = req.body;

    const exists = await permissionModel.userExistsAndIsStaff(staffId);
    if (!exists) {
        return res.status(404).json({ message: 'Staff user not found' });
    }

    const isStaff = await permissionModel.isUserStaff(staffId);
    if (!isStaff) {
        throw new HttpError(400, 'Cannot update permissions for non-staff users');
    }

    await permissionModel.updateUserPermission(staffId, permissions);

    return sendResponse(res, 200, 'Sales Summary Generated');
});

const getStaffUsers = asyncHandler(async (req, res) => {
    const staffUsers = await permissionModel.getAllStaffUsers();
    return sendResponse(res, 200, 'Staff users fetched', staffUsers);
});

const getStaffUserPermissions = asyncHandler(async (req, res) => {
    const staffId = req.params.id;

    const exists = await permissionModel.userExistsAndIsStaff(staffId);
    if (!exists) {
        return res.status(404).json({ message: 'Staff user not found' });
    }

    const permissions = await permissionModel.getStaffPermissions(staffId);
    return sendResponse(res, 200, 'Staff permissions fetched', permissions);
});

const getPermissionsList = asyncHandler(async (req, res) => {
    const permissions = await permissionModel.getAllPermissions();
    return sendResponse(res, 200, 'All permissions fetched', permissions);
});

module.exports = {
    updateStaffPermissions,
    getStaffUsers,
    getStaffUserPermissions,
    getPermissionsList,
};
