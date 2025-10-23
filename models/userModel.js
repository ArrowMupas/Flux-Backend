const SQL = require('sql-template-strings');
const pool = require('../database/pool');
const bcrypt = require('bcrypt');

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
    const [result] = await pool.query('UPDATE users SET username=?, address=?, contact_number=? WHERE id=?', [
        updates.username,
        updates.address,
        updates.contact_number,
        userId,
    ]);

    return await getUserById(userId);
};

// Function to reset user password
const resetUserPassword = async (userId, newPasswordHash) => {
    const [result] = await pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
        newPasswordHash,
        userId,
    ]);

    return await getUserById(userId);
};

// Function to save email verification token
const saveVerificationToken = async (userId, token) => {
    await pool.query(`INSERT INTO email_verification_tokens (user_id, token) VALUES (?, ?)`, [userId, token]);
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

const getUserStats = async (userId) => {
    const [stats] = await pool.query(SQL`
    SELECT
      (SELECT COUNT(*) FROM orders WHERE customer_id = ${userId}) AS total_orders,
      (SELECT COUNT(*) FROM product_reviews WHERE user_id = ${userId}) AS total_reviews
  `);

    return stats[0];
};

// Function to delete verification token
const deleteVerificationToken = async (token) => {
    await pool.query(`DELETE FROM email_verification_tokens WHERE token = ?`, [token]);
};

// PASSWORD RESET STARTS HERE

const saveResetToken = async (userId, token, expiresAt) => {
    //Remove any existing password_reset_tokens
    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);

    //Gives new Token
    await pool.query(`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`, [
        userId,
        token,
        expiresAt,
    ]);
};

const getResetToken = async (userId) => {
    const [token] = await pool.query(`SELECT * FROM password_reset_tokens WHERE user_id = ?`, [userId]);
    return token[0];
};

const deleteResetToken = async (userId) => {
    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);
};

// This is for Node-cron to clean (Thank you robeck)
const deleteExpiredResetTokens = async () => {
    await pool.query(`DELETE FROM password_reset_tokens WHERE expires_at < NOW()`);
};

// Updates User Pass
const resetUserPasswordFromToken = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
        hashedPassword,
        userId,
    ]);
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
    getUserStats,
    saveResetToken,
    getResetToken,
    deleteResetToken,
    deleteExpiredResetTokens,
    resetUserPasswordFromToken,
};
