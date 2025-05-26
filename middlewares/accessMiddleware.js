const { hasUserPermission } = require('../models/permissionModel');
const pool = require('../database/pool');

const authorizeAccess = (allowedRoles = [], requiredPermission = null) => {
    return async (req, res, next) => {
        const user = req.user;

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied: Role not allowed' });
        }

        if (user.role === 'staff' && requiredPermission) {
            try {
                const hasPermission = await hasUserPermission(user.id, requiredPermission);

                if (!hasPermission) {
                    return res.status(403).json({ message: 'Access denied: Missing permission' });
                }
            } catch (err) {
                console.error(err);
                return res.status(500).json({ message: 'Permission check failed' });
            }
        }
        next();
    };
};

module.exports = authorizeAccess;
