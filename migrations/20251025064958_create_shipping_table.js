exports.up = function (knex) {
    return knex.schema.createTable('shipping', function (table) {
        table.increments('id').primary();

        table.decimal('shipping_price', 10, 2).notNullable();
        table.string('shipping_company', 100).notNullable();

        table.string('order_reference_number', 100).notNullable();

        table.string('order_id', 50).notNullable().references('id').inTable('orders').onDelete('CASCADE');

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('shipping');
};
