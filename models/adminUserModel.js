const pool = require('../database/pool');

const getAllUsers = async () => {
    const [users] = await pool.query(
        `SELECT 
            u.id, 
            u.username,
            u.email,
            r.name AS role_name, 
            u.is_active,
            u.contact_number, 
            u.address, 
            u.created_at, 
            u.updated_at
        FROM users u
        JOIN roles r ON u.role_id = r.id`
    );
    return users;
};

const getUserById = async (userId) => {
    const [user] = await pool.query(
        `SELECT 
            u.id, 
            u.username,
            u.email,
            r.name AS role_name, 
            u.is_active,
            u.contact_number, 
            u.address, 
            u.created_at, 
            u.updated_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?`,
        [userId]
    );
    return user[0];
};

// Function to update a user
const updateUser = async (id, username, email, address, contact_number, role_id) => {
    const [result] = await pool.query(
        'UPDATE users SET username = ?, email = ?, address = ?, contact_number = ?, role_id = ? WHERE id = ?',
        [username, email, address, contact_number, role_id, id]
    );
    return await getUserById(id);
};

// Function to deactivate or activate a user
const manageUser = async (id, isActive) => {
    const [result] = await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [
        isActive,
        id,
    ]);
    return result;
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    manageUser,
};
