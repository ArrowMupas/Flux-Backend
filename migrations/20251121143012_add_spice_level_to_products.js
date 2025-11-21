exports.up = function (knex) {
    return knex.schema.table('products', function (table) {
        table.integer('spice_level').defaultTo(0);
    });
};

exports.down = function (knex) {
    return knex.schema.table('products', function (table) {
        table.dropColumn('spice_level');
    });
};
