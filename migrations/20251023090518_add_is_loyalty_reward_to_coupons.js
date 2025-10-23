export async function up(knex) {
    await knex.schema.alterTable('coupons', (table) => {
        table.boolean('is_loyalty_reward').defaultTo(false).after('times_used');
    });
}

export async function down(knex) {
    await knex.schema.alterTable('coupons', (table) => {
        table.dropColumn('is_loyalty_reward');
    });
}
