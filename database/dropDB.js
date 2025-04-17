const mysql = require('mysql2/promise');
require('dotenv').config();

const dropDatabase = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            port: process.env.DB_PORT,
        });

        await connection.query('DROP DATABASE IF EXISTS sauce');
        console.log('Database dropped and died in agony.');

        await connection.end();
    } catch (error) {
        console.error('Error dropping database:', error);
    }
};

dropDatabase();
