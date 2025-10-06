require('dotenv').config();
/*
So we have installed Knex but never really used it as we preferred Raw Queries
To not waste it we can use it instead for migrations
Migrations is so that we can update our database easily both for development and production
Also makes sure we have a full history and so therefore we can rollback or see the changes
 */
const sharedConfig = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    },
    pool: { min: 0, max: 5 },
    migrations: {
        tableName: 'knex_migrations',
        directory: './migrations',
    },
};

// To try, just search how to do knex migrations
// Only do development as production secrets will not be shared
module.exports = {
    development: sharedConfig,
    production: sharedConfig,
};

/*
  How to run migrations and seeds:

  👉 Run latest migrations
     npx knex migrate:latest --env development
     npx knex migrate:latest --env production

  👉 Rollback last batch
     npx knex migrate:rollback --env development
     npx knex migrate:rollback --env production

  👉 Create a new migration
     npx knex migrate:make <migration_name>

  👉 Run seed files (insert sample/default data)
     npx knex seed:run --env development
     npx knex seed:run --env production
*/
