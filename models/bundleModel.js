const pool = require('../database/pool');

// Admin
const getAllBundles = async () => {
    const [bundles] = await pool.query(`SELECT * FROM bundles WHERE is_active = TRUE`);
    return bundles;
};

const getBundleById = async (id) => {
    const [[bundle]] = await pool.query(`SELECT * FROM bundles WHERE bundle_id = ?`, [id]);
    if (!bundle) return null;

    const [items] = await pool.query(
        `
    SELECT bi.product_id, bi.quantity, p.name, p.price
    FROM bundle_items bi
    JOIN products p ON bi.product_id = p.id
    WHERE bi.bundle_id = ?`,
        [id]
    );

    return { ...bundle, items };
};

const createBundle = async ({ name, description, price, is_active = true, items }) => {
    const [result] = await pool.query(
        `
    INSERT INTO bundles (name, description, price, is_active)
    VALUES (?, ?, ?, ?)`,
        [name, description, price, is_active]
    );
    const bundleId = result.insertId;

    for (const item of items) {
        await pool.query(
            `
      INSERT INTO bundle_items (bundle_id, product_id, quantity)
      VALUES (?, ?, ?)`,
            [bundleId, item.product_id, item.quantity]
        );
    }

    return bundleId;
};

const updateBundle = async (id, { name, description, price, is_active, items }) => {
    await pool.query(
        `
    UPDATE bundles SET name = ?, description = ?, price = ?, is_active = ?
    WHERE bundle_id = ?`,
        [name, description, price, is_active, id]
    );

    await pool.query(`DELETE FROM bundle_items WHERE bundle_id = ?`, [id]);

    for (const item of items) {
        await pool.query(
            `
      INSERT INTO bundle_items (bundle_id, product_id, quantity)
      VALUES (?, ?, ?)`,
            [id, item.product_id, item.quantity]
        );
    }
};

const deleteBundle = async (id) => {
    await pool.query(`DELETE FROM bundle_items WHERE bundle_id = ?`, [id]);
    await pool.query(`DELETE FROM bundles WHERE bundle_id = ?`, [id]);
};

const getBundleItemsWithProducts = async (bundleId) => {
    const [items] = await pool.query(
        `
        SELECT 
            bi.bundle_id,
            bi.product_id,
            bi.quantity,
            p.name as product_name,
            p.stock_quantity,
            p.reserved_quantity,
            p.price,
            p.is_active
        FROM bundle_items bi
        JOIN products p ON bi.product_id = p.id
        WHERE bi.bundle_id = ?`,
        [bundleId]
    );
    return items;
};

const getBundlesByProductId = async (productId) => {
    const [bundles] = await pool.query(
        `
        SELECT DISTINCT b.*
        FROM bundles b
        JOIN bundle_items bi ON b.bundle_id = bi.bundle_id
        WHERE bi.product_id = ? AND b.is_active = TRUE`,
        [productId]
    );
    return bundles;
};

module.exports = {
    getAllBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    getBundleItemsWithProducts,
    getBundlesByProductId,
};
