exports.up = async function(knex) {
  const hasWishlists = await knex.schema.hasTable('wishlists');
  if (!hasWishlists) {
    await knex.schema.createTable('wishlists', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    });
  }

  const hasWishlistItems = await knex.schema.hasTable('wishlist_items');
  if (!hasWishlistItems) {
    await knex.schema.createTable('wishlist_items', (table) => {
      table.increments('id').primary();
      table.integer('wishlist_id').notNullable().unsigned();
      table.string('product_id', 50).notNullable();
      table.timestamp('added_at').defaultTo(knex.fn.now());

      table.foreign('wishlist_id').references('id').inTable('wishlists').onDelete('CASCADE');
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');

      table.unique(['wishlist_id', 'product_id']);
    });
  }
};

exports.down = async function(knex) {
  const hasWishlistItems = await knex.schema.hasTable('wishlist_items');
  if (hasWishlistItems) await knex.schema.dropTable('wishlist_items');

  const hasWishlists = await knex.schema.hasTable('wishlists');
  if (hasWishlists) await knex.schema.dropTable('wishlists');
};
