/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('notifications', function (table) {
        table.increments('id').primary();
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('type', 255).defaultTo('info');
        table.string('title', 255).nullable();
        table.text('message').notNullable();
        table.string('order_id', 50).nullable();
        table.enu('status', ['unread', 'read']).defaultTo('unread');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('notifications');
};
