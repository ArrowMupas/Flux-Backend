exports.up = function (knex) {
    return knex.schema.table('returns', function (table) {
        table.string('image_url', 255).nullable().after('contact_number'); // adds the column after contact_number
    });
};

exports.down = function (knex) {
    return knex.schema.table('returns', function (table) {
        table.dropColumn('image_url');
    });
};
