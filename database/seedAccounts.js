const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

(async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
        });

        console.log('🔍 Checking for existing accounts...');

        // Check if accounts already exist
        const [existingAccounts] = await connection.execute(
            'SELECT username FROM users WHERE username IN (?, ?)',
            ['admin', 'user1']
        );

        if (existingAccounts.length > 0) {
            console.log('⏩ Accounts already exist. Skipping seeding.');
            console.log(
                '   Found existing accounts:',
                existingAccounts.map((acc) => acc.username)
            );
            await connection.end();
            process.exit(0); // Exit successfully
        }

        console.log('👥 Seeding default accounts...');

        const saltRounds = 10;
        const adminPassword = await bcrypt.hash('Admin1234', saltRounds);
        const userPassword = await bcrypt.hash('User1234', saltRounds);

        // Admin account
        await connection.execute(
            `INSERT INTO users (username, email, password_hash, role_id, is_verified, is_active, contact_number, address) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'admin1234',
                'Admin@example.com',
                adminPassword,
                1,
                true,
                true,
                '+1234567890',
                '123 Admin Street, City',
            ]
        );

        // User account
        await connection.execute(
            `INSERT INTO users (username, email, password_hash, role_id, is_verified, is_active, contact_number, address) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'user1234',
                'User1@example.com',
                userPassword,
                2,
                true,
                true,
                '+0987654321',
                '456 User Avenue, Town',
            ]
        );

        console.log('✅ Default accounts seeded:');
        console.log('   Admin: admin@example.com / admin1234');
        console.log('   User:  user1@example.com / user1234');

        await connection.end();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
})();
