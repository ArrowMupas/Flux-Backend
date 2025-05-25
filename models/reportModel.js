const pool = require('../database/pool');

const fetchSalesSummary = async (start, end) => {
    end = end + ` 23:59:59`;

    // Get total orders and total sales
    const [[salesStats]] = await pool.query(
        `SELECT 
            COUNT(id) AS totalOrders,
            SUM(total_amount) AS totalSales
         FROM orders
         WHERE order_date BETWEEN ? AND ?
           AND status IN ('processing', 'shipped', 'delivered')`,
        [start, end]
    );

    // Get total items sold
    const [[itemsStats]] = await pool.query(
        `SELECT 
            SUM(oi.quantity) AS totalItemsSold
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.order_date BETWEEN ? AND ?
           AND o.status IN ('processing', 'shipped', 'delivered')`,
        [start, end]
    );

    return {
        totalOrders: salesStats.totalOrders || 0,
        totalSales: salesStats.totalSales || 0,
        totalItemsSold: itemsStats.totalItemsSold || 0,
    };
};

const fetchTopProducts = async (start, end) => {
    end = end + ` 23:59:59`;

    const [rows] = await pool.query(
        `SELECT 
            p.id AS productId,
            p.name,
            SUM(oi.quantity) AS totalSold,
            p.price AS unitPrice,
            SUM(oi.subtotal) AS totalRevenue
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.order_date BETWEEN ? AND ?
           AND o.status IN ('processing', 'shipped', 'delivered')
         GROUP BY p.id
         ORDER BY totalSold DESC
         LIMIT 10`,
        [start, end]
    );
    return rows;
};

const fetchSalesPerDay = async (start, end) => {
    end = end + ` 23:59:59`;

    const [rows] = await pool.query(
        `SELECT 
            DATE(o.order_date) AS date,
            COUNT(DISTINCT o.id) AS orders,
            SUM(o.total_amount) AS totalSales
         FROM orders o
         WHERE o.order_date BETWEEN ? AND ?
           AND o.status IN ('processing', 'shipped', 'delivered')
         GROUP BY DATE(o.order_date)
         ORDER BY DATE(o.order_date) ASC`,
        [start, end]
    );
    return rows;
};

const fetchUserReport = async (start, end) => {
    end = end + ' 23:59:59';

    const [rows] = await pool.query(
        `SELECT 
            COUNT(*) AS totalUsers,
            COUNT(CASE 
                WHEN created_at BETWEEN ? AND ? THEN 1 
            END) AS signupsInTimeframe
        FROM users`,
        [start, end]
    );

    return {
        totalUsers: rows[0].totalUsers,
        signupsInTimeframe: rows[0].signupsInTimeframe,
    };
};

module.exports = {
    fetchSalesSummary,
    fetchTopProducts,
    fetchSalesPerDay,
    fetchUserReport,
};
