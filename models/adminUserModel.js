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
            u.is_verified,
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

// Function to get users with optional filters
const getUsers = async ({ role, is_active, is_verified }) => {
    let baseQuery = `
        SELECT 
            u.id, 
            u.username,
            u.email,
            r.name AS role_name, 
            u.is_active,
            u.is_verified,
            u.contact_number, 
            u.address, 
            u.created_at, 
            u.updated_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE 1=1
    `;
    const params = [];

    if (role) {
        baseQuery += ' AND r.name = ?';
        params.push(role);
    }

    if (is_active !== undefined) {
        baseQuery += ' AND u.is_active = ?';
        params.push(is_active === 'true');
    }

    if (is_verified !== undefined) {
        baseQuery += ' AND u.is_verified = ?';
        params.push(is_verified === 'true');
    }

    const [users] = await pool.query(baseQuery, params);
    return users;
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
        `INSERT INTO users (username, email, password_hash, role_id, is_verified) 
         VALUES (?, ?, ?, ?, ?)`,
        [username, email, password, role, true]
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
    getUsers,
};
