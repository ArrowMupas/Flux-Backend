const pool = require("../database/pool");

const getUserById = async (id) => {
  const [user] = await pool.query(
    `SELECT 
            user.id, 
            roles.name AS role_name, 
            username, 
            address, 
            contact_number, 
            email, 
            created_at,
            updated_at
         FROM user 
         JOIN roles ON user.role_id = roles.id 
         WHERE user.id = ?`,
    [id]
  );
  return user[0];
};

const getUserByEmail = async (email) => {
  const [user] = await pool.query("SELECT * FROM user WHERE email = ?", [
    email,
  ]);
  return user[0];
};

const createUser = async (username, email, password) => {
  const [result] = await pool.query(
    `INSERT INTO user (username, email, password_hash) 
         VALUES (?, ?, ?)`,
    [username, email, password]
  );

  const newUser = await getUserById(result.insertId);
  return newUser;
};

const updateUser = async (userId, updates) => {
  const [result] = await pool.query(
    "UPDATE user SET username=?, address=?, contact_number=? WHERE id=?",
    [updates.username, updates.address, updates.contact_number, userId]
  );

  return await getUserById(userId);
};

module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
};
