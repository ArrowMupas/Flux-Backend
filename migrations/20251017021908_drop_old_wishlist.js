/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.dropTableIfExists('wishlist');
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function(knex) {
  await knex.schema.createTable('wishlist', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned();
    table.integer('product_id').unsigned();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};
