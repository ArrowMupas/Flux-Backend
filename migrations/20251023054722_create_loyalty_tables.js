export async function up(knex) {
    await knex.schema.createTable('loyalty_rewards', (table) => {
        table.increments('id').primary();
        table.integer('required_orders').notNullable();
        table.integer('coupon_id').notNullable();
        table.boolean('is_monthly').defaultTo(false);
        table.boolean('active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('user_claimed_rewards', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.integer('reward_id').notNullable();
        table.timestamp('claimed_at').defaultTo(knex.fn.now());
        table.unique(['user_id', 'reward_id']);
    });

    await knex.schema.createTable('user_loyalty_progress', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable().unique();
        table.integer('total_orders').defaultTo(0);
        table.timestamp('last_updated').defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('user_loyalty_progress');
    await knex.schema.dropTableIfExists('user_claimed_rewards');
    await knex.schema.dropTableIfExists('loyalty_rewards');
}
