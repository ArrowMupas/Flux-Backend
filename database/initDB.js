const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

(async () => {
  try {
    // 1. Connect to MySQL without selecting a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
    });

    console.log("✅ Connected to MySQL server");

    // 2. Create the database if it doesn't exist
    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`;
    await connection.query(createDatabaseQuery);
    console.log(`✅ Database '${process.env.DB_NAME}' is ready`);

    // 3. Select the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // 4. Run the initialization SQL script
    const sqlFilePath = "database/init.sql"; // Make sure this file is in the correct path
    const sql = fs.readFileSync(sqlFilePath, "utf8");
    const queries = sql.split(";").filter((query) => query.trim());
    for (const query of queries) {
      await connection.query(query);
    }

    console.log("✅ Database initialized successfully");
    await connection.end(); // Close the connection after all queries are run
  } catch (error) {
    console.error("❌ Error:", error);
  }
})();
