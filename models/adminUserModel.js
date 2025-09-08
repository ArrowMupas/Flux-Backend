const pool = require('../database/pool');
const SQL = require('sql-template-strings');

const getUsers = async ({ role, is_active, is_verified }) => {
    const query = SQL`
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

    if (role) {
        query.append(SQL` AND r.name = ${role}`);
    }

    if (is_active !== undefined) {
        query.append(SQL` AND u.is_active = ${is_active === 'true'}`);
    }

    if (is_verified !== undefined) {
        query.append(SQL` AND u.is_verified = ${is_verified === 'true'}`);
    }

    query.append(SQL` ORDER BY u.created_at DESC`);

    const [users] = await pool.query(query);
    return users;
};

const createUser = async (username, email, password, role) => {
    const query = SQL`
    INSERT INTO users (username, email, password_hash, role_id, is_verified)
    VALUES (${username}, ${email}, ${password}, ${role}, ${true})
  `;

    const [result] = await pool.query(query);
    return await getUserById(result.insertId);
};

const getUserById = async (userId) => {
    const [user] = await pool.query(
        `SELECT 
            u.id, 
            u.username,
            u.email,
            r.name AS role, 
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

    return user[0] || null;
};

const getUserByEmail = async (email) => {
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return user[0] || null;
};

const updateUser = async (id, username, email, address, contact_number) => {
    await pool.query('UPDATE users SET username = ?, email = ?, address = ?, contact_number = ? WHERE id = ?', [
        username,
        email,
        address,
        contact_number,
        id,
    ]);
    return await getUserById(id);
};
// Function to deactivate or activate a user
const manageUser = async (id, isActive) => {
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
    return;
};

// Function to get a user by email
const getUserByUsername = async (username) => {
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return user[0];
};

module.exports = {
    getUserById,
    getUserByEmail,
    updateUser,
    manageUser,
    getUserByUsername,
    createUser,
    getUsers,
};
