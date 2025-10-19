exports.up = async function (knex) {
    await knex.schema.alterTable('product_reviews', (table) => {
        table.enum('status', ['active', 'flagged', 'removed']).notNullable().defaultTo('active');
    });

    await knex.schema.alterTable('product_reviews', (table) => {
        table.index('status');
    });

    await knex('staff_permissions').insert([{ name: 'moderate_review' }, { name: 'manage_products' }]);

    await knex('staff_permissions')
        .whereIn('name', ['get_daily_sales', 'get_sales_summary', 'get_top_products', 'get_user_report'])
        .del();
};

exports.down = async function (knex) {
    await knex.schema.alterTable('product_reviews', (table) => {
        table.dropIndex('status');
        table.dropColumn('status');
    });

    await knex('staff_permissions').insert([
        { id: 1, name: 'get_sales_summary' },
        { id: 2, name: 'get_top_products' },
        { id: 3, name: 'get_daily_sales' },
        { id: 4, name: 'get_user_report' },
    ]);

    await knex('staff_permissions').whereIn('name', ['moderate_review', 'manage_products']).del();
};
