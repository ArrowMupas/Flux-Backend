const pool = require('../database/pool');

const hasUserPermission = async (userId, permissionName) => {
    const [rows] = await pool.query(
        `
        SELECT 1 
        FROM user_permissions up
        JOIN staff_permissions sp ON up.permission_id = sp.id
        WHERE up.user_id = ? AND sp.name = ?
        LIMIT 1
        `,
        [userId, permissionName]
    );

    return rows.length > 0;
};

const updateUserPermission = async (userId, permissions, connection = pool) => {
    await connection.query('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

    for (const name of permissions) {
        const [[permission]] = await connection.query(
            'SELECT id FROM staff_permissions WHERE name = ?',
            [name]
        );
        if (permission) {
            await connection.query(
                'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
                [userId, permission.id]
            );
        }
    }
};

const isUserStaff = async (userId) => {
    const [[user]] = await pool.query(
        `SELECT r.name AS role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [userId]
    );

    return user && user.role_name === 'staff';
};

const userExistsAndIsStaff = async (userId) => {
    const [rows] = await pool.query(
        `SELECT 1 
         FROM users u 
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ? AND r.name = 'staff'`,
        [userId]
    );
    return rows.length > 0;
};

// Get all users who are staff
const getAllStaffUsers = async () => {
    const [staffUsers] = await pool.query(
        `SELECT u.id, u.username, u.email, r.name AS role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE r.name = 'staff'`
    );
    return staffUsers;
};

// Get permissions of a specific staff user by userId
const getStaffPermissions = async (userId) => {
    const [permissions] = await pool.query(
        `SELECT sp.id, sp.name
         FROM user_permissions up
         JOIN staff_permissions sp ON up.permission_id = sp.id
         WHERE up.user_id = ?`,
        [userId]
    );
    return permissions;
};

// Get all available permissions (for staff)
const getAllPermissions = async () => {
    const [permissions] = await pool.query(`SELECT id, name FROM staff_permissions`);
    return permissions;
};

module.exports = {
    hasUserPermission,
    updateUserPermission,
    isUserStaff,
    getAllStaffUsers,
    getStaffPermissions,
    getAllPermissions,
    userExistsAndIsStaff,
};
