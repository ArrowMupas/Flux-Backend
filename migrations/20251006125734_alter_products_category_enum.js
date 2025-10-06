exports.up = async function (knex) {
    // Update all categories to 'condiment'
    await knex('products')
        .whereNull('category')
        .orWhereNotIn('category', ['condiment', 'pickles', 'powders'])
        .update({ category: 'condiment' });

    // Alter the column type to ENUM
    await knex.schema.alterTable('products', (table) => {
        table.enum('category', ['condiment', 'pickles', 'powders']).notNullable().defaultTo('condiment').alter();
    });
};

exports.down = async function (knex) {
    // Revert to plain string on roll back
    await knex.schema.alterTable('products', (table) => {
        table.string('category', 100).nullable().alter();
    });
};
