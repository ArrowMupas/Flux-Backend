const pool = require('../database/pool');

// Function to get a user by ID
const getUserById = async (id) => {
    const [user] = await pool.query(
        `SELECT 
            users.id, 
            roles.name AS role_name, 
            username, 
            address, 
            contact_number, 
            email, 
            created_at,
            updated_at
         FROM users 
         JOIN roles ON users.role_id = roles.id 
         WHERE users.id = ?`,
        [id]
    );
    return user[0];
};

// Function to get a user by email
const getUserByEmail = async (email) => {
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return user[0];
};

// Function to create user
const createUser = async (username, email, password) => {
    const [result] = await pool.query(
        `INSERT INTO users (username, email, password_hash) 
         VALUES (?, ?, ?)`,
        [username, email, password]
    );

    const newUser = await getUserById(result.insertId);
    return newUser;
};

// Function to update user
const updateUser = async (userId, updates) => {
    const [result] = await pool.query(
        'UPDATE users SET username=?, address=?, contact_number=? WHERE id=?',
        [updates.username, updates.address, updates.contact_number, userId]
    );

    return await getUserById(userId);
};

const getAllUsers = async () => {
    const [users] = await pool.query(`
        SELECT 
            u.id, 
            u.username, 
            u.email, 
            r.name as role_name,
            u.address,
            u.contact_number,
            u.created_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
    `);
    return users;
};

module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    getAllUsers
};
