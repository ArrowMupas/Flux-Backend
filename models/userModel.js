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
            password_hash,
            is_active,
            is_verified,
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
const getUserByUsername = async (username) => {
    const [user] = await pool.query(
        `SELECT 
            users.*, 
            roles.name AS role_name
        FROM users
        JOIN roles ON users.role_id = roles.id
        WHERE users.username = ?`,
        [username]
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

// Function to log a user login
const logUserLogin = async (userId, username) => {
    await pool.query(
        `INSERT INTO login_logs (user_id, username)
         VALUES (?, ?)`,
        [userId, username]
    );
};

// Function to reset user password
const resetUserPassword = async (userId, newPasswordHash) => {
    const [result] = await pool.query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [newPasswordHash, userId]
    );

    return await getUserById(userId);
};

// Function to save email verification token
const saveVerificationToken = async (userId, token) => {
    await pool.query(`INSERT INTO email_verification_tokens (user_id, token) VALUES (?, ?)`, [
        userId,
        token,
    ]);
};

// Function to get user by verification token
const getUserByVerificationToken = async (token) => {
    const [rows] = await pool.query(
        `SELECT users.*, roles.name AS role_name
         FROM users
         JOIN roles ON users.role_id = roles.id
         JOIN email_verification_tokens evt ON users.id = evt.user_id
         WHERE evt.token = ?
         LIMIT 1`,
        [token]
    );
    return rows[0];
};

// Function to verify user by ID
const verifyUser = async (userId) => {
    await pool.query(`UPDATE users SET is_verified = 1 WHERE id = ?`, [userId]);
};

// Function to delete verification token
const deleteVerificationToken = async (token) => {
    await pool.query(`DELETE FROM email_verification_tokens WHERE token = ?`, [token]);
};

// Function to save password reset token
const savePasswordResetToken = async (userId, token, expires_at) => {
    await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
        [userId, token, expires_at]
    );
};

// Function to get user by password reset token
const getUserByPasswordResetToken = async (token) => {
    const [rows] = await pool.query(
        `SELECT users.*, roles.name AS role_name
         FROM users
         JOIN roles ON users.role_id = roles.id
         JOIN password_reset_tokens prt ON users.id = prt.user_id
         WHERE prt.token = ? AND prt.expires_at > NOW()
         LIMIT 1`,
        [token]
    );
    return rows[0];
};

// Function to check if user has an active password reset request
const hasActivePasswordResetRequest = async (userId) => {
    const [rows] = await pool.query(
        `SELECT id FROM password_reset_tokens 
         WHERE user_id = ? AND expires_at > NOW()
         LIMIT 1`,
        [userId]
    );
    return rows.length > 0;
};

// Function to delete password reset token
const deletePasswordResetToken = async (userId) => {
    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);
};

module.exports = {
    getUserById,
    getUserByUsername,
    getUserByEmail,
    createUser,
    updateUser,
    resetUserPassword,
    saveVerificationToken,
    getUserByVerificationToken,
    verifyUser,
    deleteVerificationToken,
    savePasswordResetToken,
    getUserByPasswordResetToken,
    hasActivePasswordResetRequest,
    deletePasswordResetToken,
    logUserLogin,
};
