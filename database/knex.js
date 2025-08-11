const knex = require('knex');
require('dotenv').config();

const knexInstance = knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    },
    pool: { min: 0, max: 5 },
});

module.exports = knexInstance;
