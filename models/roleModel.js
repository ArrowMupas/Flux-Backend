const pool = require('../database/pool');

const getRoleByName = async (username) => {
    const [role] = await pool.query(
        "SELECT * FROM roles WHERE name = ?",
        [username]
    );
    return role[0];
};

module.exports = { getRoleByName };