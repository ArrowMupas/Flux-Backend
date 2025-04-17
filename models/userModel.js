const pool = require("../database/pool");

const getUserById = async (id) => {
    const [user] = await pool.query(
        `SELECT user.*, roles.name as role_name 
         FROM user JOIN roles ON user.role_id = roles.id
         WHERE user.id = ?`,
        [id]
    );
    return user[0];
};


const getUserByEmail = async (email) => {
    const [user] = await pool.query(
        "SELECT * FROM user WHERE email = ?",
        [email]
    );
    return user[0];
};

const createUser = async (username, email, password) => {
    console.log('DB Query - Creating user:', { username, email });
    
    const [result] = await pool.query(
        `INSERT INTO user (username, email, password) 
         VALUES (?, ?, ?)`,
        [username, email, password]
    );
    
    console.log('DB Insert Result:', result);
    
    const newUser = await getUserById(result.insertId);
    console.log('Retrieved created user:', newUser);
    
    return newUser;
};

const updateUser = async (userId, updates) => {
    // 1. Execute the update
    const [result] = await pool.query(
        "UPDATE user SET username=?, address=?, contact_number=? WHERE id=?",
        [updates.username, updates.address, updates.contact_number, userId]
    );

    // 2. Verify the update was successful
    if (result.affectedRows === 0) {
        throw new Error("No user found or no changes made");
    }

    // 3. Return the updated user data
    return await getUserById(userId);
};

module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    updateUser
};