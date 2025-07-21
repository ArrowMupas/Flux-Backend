const pool = require('../database/pool');

// Function to fetch sales summary for a given date range
const fetchSalesSummary = async (start, end) => {
    end = `${end  } 23:59:59`;

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
    end = `${end  } 23:59:59`;

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
              AND status IN ('pending', 'processing', 'shipping', 'delivered', 'cancelled')
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
                ELSE 7
            END
        `,
        [start, end]
    );

    return rows;
};

// Function to fetch top 10 products sold in a given date range
const fetchTopProducts = async (start, end) => {
    end = `${end  } 23:59:59`;

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
    end = `${end  } 23:59:59`;

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
    end = `${end  } 23:59:59`;

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
    fetchSalesSummaryByStatus,
};
