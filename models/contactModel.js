const pool = require('../database/pool');

const createContact = async ({ name, email, message }) => {
    const [result] = await pool.query(
        `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`,
        [name, email, message]
    );
    return result.insertId;
};

const getAllContacts = async () => {
    const [rows] = await pool.query(`SELECT * FROM contacts ORDER BY created_at DESC`);
    return rows;
};

const getContactById = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM contacts WHERE id = ?`, [id]);
    return rows[0];
};

const deleteContact = async (id) => {
    await pool.query(`DELETE FROM contacts WHERE id = ?`, [id]);
};

module.exports = {
    createContact,
    getAllContacts,
    getContactById,
    deleteContact,
};
