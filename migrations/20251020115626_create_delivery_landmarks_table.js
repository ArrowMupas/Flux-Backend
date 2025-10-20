exports.up = function (knex) {
  return knex.schema.createTable('delivery_landmarks', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().unique();
    table.decimal('latitude', 10, 7).notNullable();
    table.decimal('longitude', 10, 7).notNullable();
    table.string('address', 255).notNullable();
    table.string('label', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('delivery_landmarks');
};
