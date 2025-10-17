/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  // Add wishlist_count column to products if not exists
  const hasColumn = await knex.schema.hasColumn('products', 'wishlist_count');
  if (!hasColumn) {
    await knex.schema.alterTable('products', (table) => {
      table.integer('wishlist_count').notNullable().defaultTo(0);
    });
  }

  // Create wishlists table if not exists
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

  // Create wishlist_items table if not exists
  const hasWishlistItems = await knex.schema.hasTable('wishlist_items');
  if (!hasWishlistItems) {
    await knex.schema.createTable('wishlist_items', (table) => {
      table.increments('id').primary();
      table.integer('wishlist_id').notNullable().unsigned();
      table.string('product_id', 50).notNullable();
      table.timestamp('added_at').defaultTo(knex.fn.now());

      table.foreign('wishlist_id').references('id').inTable('wishlists').onDelete('CASCADE');
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');

      table.unique(['wishlist_id', 'product_id']); // prevent duplicates
    });
  }

  // triggers YEY 
  await knex.raw(`
    DROP TRIGGER IF EXISTS wishlist_items_after_insert;
  `);

  await knex.raw(`
    CREATE TRIGGER wishlist_items_after_insert
    AFTER INSERT ON wishlist_items
    FOR EACH ROW
    BEGIN
      UPDATE products
      SET wishlist_count = wishlist_count + 1
      WHERE id = NEW.product_id;
    END;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS wishlist_items_after_delete;
  `);

  await knex.raw(`
    CREATE TRIGGER wishlist_items_after_delete
    AFTER DELETE ON wishlist_items
    FOR EACH ROW
    BEGIN
      UPDATE products
      SET wishlist_count = GREATEST(wishlist_count - 1, 0)
      WHERE id = OLD.product_id;
    END;
  `);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function(knex) {
  // Drop triggers first
  await knex.raw(`DROP TRIGGER IF EXISTS wishlist_items_after_insert;`);
  await knex.raw(`DROP TRIGGER IF EXISTS wishlist_items_after_delete;`);

  // Drop tables if they exist
  const hasWishlistItems = await knex.schema.hasTable('wishlist_items');
  if (hasWishlistItems) await knex.schema.dropTable('wishlist_items');

  const hasWishlists = await knex.schema.hasTable('wishlists');
  if (hasWishlists) await knex.schema.dropTable('wishlists');

  // Drop wishlist_count column if exists
  const hasColumn = await knex.schema.hasColumn('products', 'wishlist_count');
  if (hasColumn) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('wishlist_count');
    });
  }
};
