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

    const io = req.app.get('io');
    io.to(`staff_${staffId}`).emit('permissions:updated', {
        message: 'Your permissions have been updated. Please refresh.',
    });
    return sendResponse(res, 200, 'Sales Summary Generated');
});

const getMyPermissions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const isStaff = await permissionModel.isUserStaff(userId);
    if (!isStaff && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const userPermissions = await permissionModel.getUserPermissions(userId);
    return sendResponse(
        res,
        200,
        'Permissions fetched',
        userPermissions.map((p) => p.name)
    );
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
    getMyPermissions,
};
