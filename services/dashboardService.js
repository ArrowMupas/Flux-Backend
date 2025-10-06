const pool = require('../database/pool');

const getDashboardMetrics = async () => {

    const [customerResults] = await pool.query(`
        SELECT COUNT(u.id) as total_customers
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'customer'
    `);
    
 
    const [onlineResults] = await pool.query(`
        SELECT
            COUNT(DISTINCT o.id) as online_orders_count,
            COALESCE(SUM(o.total_amount), 0) as online_total_sales,
            COALESCE(SUM(oi.quantity), 0) as online_items_sold
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
    `);

    const [walkInResults] = await pool.query(`
        SELECT
            COUNT(DISTINCT w.id) as walkin_orders_count,
            COALESCE(SUM(w.total_amount), 0) as walkin_total_sales,
            COALESCE(SUM(wi.quantity), 0) as walkin_items_sold
        FROM walk_in_sales w
        LEFT JOIN walk_in_sale_items wi ON w.id = wi.sale_id
    `);

    const onlineMetrics = onlineResults[0];
    const walkInMetrics = walkInResults[0];
    
    const totalSales = parseInt(onlineMetrics.online_total_sales) + parseInt(walkInMetrics.walkin_total_sales);
    const totalItemsSold = parseInt(onlineMetrics.online_items_sold) + parseInt(walkInMetrics.walkin_items_sold);

    const [recentOrders] = await pool.query(`
        SELECT 
            o.id,
            o.order_date,
            o.status,
            o.total_amount,
            u.username as customer_name
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        ORDER BY o.order_date DESC
        LIMIT 3
    `);
    
    const formattedRecentOrders = recentOrders.map(order => ({
        ...order,
        order_date: new Date(order.order_date).toISOString().slice(0, 19).replace('T', ' ')
    }));

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
        totalCustomers: customerResults[0].total_customers || 0,
        totalOnlineOrders: onlineMetrics.online_orders_count,
        totalWalkInOrders: walkInMetrics.walkin_orders_count,
        totalSales: totalSales,
        totalItemsSold: totalItemsSold,
        recentOrders: formattedRecentOrders,
        topProducts,
        lowStock
    };
};

module.exports = {
    getDashboardMetrics,
};