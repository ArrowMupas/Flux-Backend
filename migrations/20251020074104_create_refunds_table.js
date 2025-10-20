exports.up = function (knex) {
    return knex.schema.createTable('refunds', function (table) {
        table.increments('id').primary();
        table.string('order_id', 50).notNullable();
        table.integer('customer_id').notNullable();
        table.text('reason').notNullable();
        table.enu('status', ['pending', 'approved', 'denied']).defaultTo('pending');
        table.integer('processed_by').nullable();
        table.text('admin_notes').nullable();
        table.dateTime('created_at').defaultTo(knex.fn.now());
        table.dateTime('resolved_at').nullable();
        table.string('contact_number', 20).nullable();

        table.foreign('order_id').references('id').inTable('orders');
        table.foreign('customer_id').references('id').inTable('users');
        table.foreign('processed_by').references('id').inTable('users');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('refunds');
};
