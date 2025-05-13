const pool = require('../database/pool');

// Function to get all users
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

// Function to get a user by ID
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

// Function to get a user by email
const getUserByUsername = async (username) => {
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return user[0];
};

// Function to create user
const createUser = async (username, email, password, role) => {
    const [result] = await pool.query(
        `INSERT INTO users (username, email, password_hash, role_id) 
         VALUES (?, ?, ?, ?)`,
        [username, email, password, role]
    );

    const newUser = await getUserById(result.insertId);
    return newUser;
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    manageUser,
    getUserByUsername,
    createUser,
};
