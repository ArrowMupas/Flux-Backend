const pool = require('../database/pool');
const SQL = require('sql-template-strings');
const dayjs = require('dayjs');

// Function to fetch sales summary for a given date range
const fetchSalesSummary = async (start, end) => {
    end = `${end} 23:59:59`;

    // Get total orders and total sales
    const [[salesStats]] = await pool.query(
        `SELECT 
            COUNT(id) AS totalOrders,
            SUM(total_amount) AS totalSales
         FROM orders
         WHERE order_date BETWEEN ? AND ?
           AND status IN ('processing', 'shipping', 'delivered')`,
        [start, end]
    );

    // Get total items sold
    const [[itemsStats]] = await pool.query(
        `SELECT 
            SUM(oi.quantity) AS totalItemsSold
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.order_date BETWEEN ? AND ?
           AND o.status IN ('processing', 'shipping', 'delivered')`,
        [start, end]
    );

    return {
        totalOrders: salesStats.totalOrders || 0,
        totalSales: salesStats.totalSales || 0,
        totalItemsSold: itemsStats.totalItemsSold || 0,
    };
};

// Function to fetch sales summary by status for a given date range
const fetchSalesSummaryByStatus = async (start, end) => {
    end = `${end} 23:59:59`;

    const [rows] = await pool.query(
        `
    SELECT 
        grouped_status AS status,
        COUNT(*) AS totalOrders
    FROM (
        SELECT 
            CASE 
                WHEN status = 'pending' AND cancel_requested = TRUE THEN 'cancel_requested'
                WHEN status = 'pending' THEN 'pending'
                ELSE status
            END AS grouped_status
        FROM orders
        WHERE order_date BETWEEN ? AND ?
          AND status IN ('pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded', 'returned')
    ) AS derived
    GROUP BY grouped_status
    ORDER BY 
        CASE grouped_status
            WHEN 'pending' THEN 1
            WHEN 'cancel_requested' THEN 2
            WHEN 'processing' THEN 3
            WHEN 'shipping' THEN 4
            WHEN 'delivered' THEN 5
            WHEN 'cancelled' THEN 6
            WHEN 'refunded' THEN 7
            WHEN 'returned' THEN 8
            ELSE 9
        END
    `,
        [start, end]
    );

    return rows;
};

// Function to fetch top 10 products sold in a given date range
const fetchTopProducts = async (start, end) => {
    end = `${end} 23:59:59`;

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
           AND o.status IN ('processing', 'shipping', 'delivered')
         GROUP BY p.id
         ORDER BY totalSold DESC
         LIMIT 10`,
        [start, end]
    );
    return rows;
};

// Function to fetch sales per day for a given date range
const fetchSalesPerDay = async (start, end) => {
    end = `${end} 23:59:59`;

    const [rows] = await pool.query(
        `SELECT 
            DATE(o.order_date) AS date,
            COUNT(DISTINCT o.id) AS orders,
            SUM(o.total_amount) AS totalSales
         FROM orders o
         WHERE o.order_date BETWEEN ? AND ?
           AND o.status IN ('processing', 'shipping', 'delivered')
         GROUP BY DATE(o.order_date)
         ORDER BY DATE(o.order_date) ASC`,
        [start, end]
    );

    return rows;
};

// Function to fetch user report for a given date range
const fetchUserReport = async (start, end) => {
    end = `${end} 23:59:59`;

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

// Chart Thingy
const fetchWeeklySales = async (weeks = 7) => {
    const today = dayjs();
    // Find Monday of the current week
    const currentWeekMonday = today.day() === 0 ? today.subtract(6, 'day') : today.subtract(today.day() - 1, 'day');
    // Start date is N weeks before the current week Monday
    const startDate = currentWeekMonday.subtract(weeks - 1, 'week');

    const start = startDate.format('YYYY-MM-DD');
    const end = today.format('YYYY-MM-DD');
    const endWithTime = `${end} 23:59:59`;

    // Fetch sales data
    const [rows] = await pool.query(
        `SELECT DATE(order_date) AS date, SUM(total_amount) AS daily_sales
         FROM orders
         WHERE order_date BETWEEN ? AND ?
           AND status IN ('pending', 'processing', 'shipping', 'delivered')
         GROUP BY DATE(order_date)
         ORDER BY DATE(order_date) ASC`,
        [start, endWithTime]
    );

    // Map date -> daily sales
    const salesMap = {};
    rows.forEach((row) => {
        const dateKey = dayjs(row.date).format('YYYY-MM-DD');
        salesMap[dateKey] = Number(row.daily_sales);
    });

    // Fill missing dates
    const allDates = [];
    let currentDate = startDate;
    while (currentDate.isBefore(today) || currentDate.isSame(today, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        allDates.push({
            date: dateStr,
            daily_sales: salesMap[dateStr] || 0,
        });
        currentDate = currentDate.add(1, 'day');
    }

    // Group by weeks (Monday → Sunday)
    const weeklyData = [];
    for (let i = 0; i < allDates.length; i += 7) {
        const weekDays = allDates.slice(i, i + 7);
        const weekLabel = `Week ${weeklyData.length + 1} (${weekDays[0].date} - ${weekDays[weekDays.length - 1].date})`;

        weeklyData.push({
            label: weekLabel,
            days: weekDays.map((day) => day.daily_sales),
            total: weekDays.reduce((sum, d) => sum + d.daily_sales, 0),
        });
    }

    return weeklyData;
};

//For the 7 days graph thingy
const fetchDailySales = async (start, endWithTime) => {
    const query = SQL`
        SELECT DATE(order_date) AS date, SUM(total_amount) AS daily_sales
        FROM orders
        WHERE order_date BETWEEN ${start} AND ${endWithTime}
          AND status IN ('pending', 'processing', 'shipping', 'delivered')
        GROUP BY DATE(order_date)
        ORDER BY DATE(order_date) ASC
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const fetchDashboardMetrics = async () => {
    const [metrics] = await pool.query(`
        SELECT
            -- Total customers
            (SELECT COUNT(u.id)
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE r.name = 'customer') AS total_customers,

            -- Online orders
            (SELECT COUNT(DISTINCT o.id)
             FROM orders o) AS online_orders_count,
            (SELECT COALESCE(SUM(o.total_amount), 0)
             FROM orders o) AS online_total_sales,
            (SELECT COALESCE(SUM(oi.quantity), 0)
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id) AS online_items_sold,

            -- Walk-in orders
            (SELECT COUNT(DISTINCT w.id)
             FROM walk_in_sales w) AS walkin_orders_count,
            (SELECT COALESCE(SUM(w.total_amount), 0)
             FROM walk_in_sales w) AS walkin_total_sales,
            (SELECT COALESCE(SUM(wi.quantity), 0)
             FROM walk_in_sales w
             LEFT JOIN walk_in_sale_items wi ON w.id = wi.sale_id) AS walkin_items_sold
    `);

    const [topProducts] = await pool.query(`
        SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        COALESCE(SUM(oi.quantity), 0) AS total_sold
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON oi.order_id = o.id
        GROUP BY p.id, p.name, p.price, p.image
        ORDER BY total_sold DESC
        LIMIT 3
    `);

    const [lowStock] = await pool.query(`
        SELECT 
        p.id,
        p.name,
        p.stock_quantity AS stock
        FROM products p
        WHERE p.stock_quantity <= 10
        ORDER BY p.stock_quantity ASC
        LIMIT 5
    `);

    return {
        ...metrics[0], // return raw DB row
        topProducts,
        lowStock,
    };
};

module.exports = {
    fetchSalesSummary,
    fetchTopProducts,
    fetchSalesPerDay,
    fetchUserReport,
    fetchSalesSummaryByStatus,
    fetchWeeklySales,
    fetchDailySales,
    fetchDashboardMetrics,
};
