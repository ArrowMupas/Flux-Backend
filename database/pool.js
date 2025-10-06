const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true,

    connectionLimit: 15,
    queueLimit: 0,

    ssl: {
        rejectUnauthorized: false,
    },
    //  ssl: {
    //     ca: process.env.DB_SSL_CA,
    // },
});

module.exports = pool;
