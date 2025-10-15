/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
    // Insert initial permissions
    const permissions = [
        { name: 'create_walkin' },
        { name: 'view_walkin' },
        { name: 'manage_orders' },
        { name: 'view_inventory' },
        { name: 'view_sales' },
        { name: 'manage_promotions' },
    ];

    await knex('staff_permissions').insert(permissions);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
    await knex('staff_permissions')
        .whereIn('name', [
            'create_walkin',
            'view_walkin',
            'manage_orders',
            'view_inventory',
            'view_sales',
            'manage_promotions',
        ])
        .del();
};
