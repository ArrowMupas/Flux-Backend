exports.up = async function (knex) {
  // Add the new column to the product_reviews table
  await knex.schema.alterTable('product_reviews', (table) => {
    table
      .enum('status', ['active', 'flagged', 'removed'])
      .notNullable()
      .defaultTo('active');
  });

  // index on status for faster admin queries
  await knex.schema.alterTable('product_reviews', (table) => {
    table.index('status');
  });

  // Adds the new perms
  await knex('staff_permissions').insert([
    { name: 'moderate_review' }
  ]);
};

exports.down = async function (knex) {
  // Rollback by removing the status column
  await knex.schema.alterTable('product_reviews', (table) => {
    table.dropIndex('status');
    table.dropColumn('status');
  });

  await knex('staff_permissions')
    .where('name', 'moderate_review')
    .del();
};