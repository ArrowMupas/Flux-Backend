const pool = require('../database/pool');

const getDashboardMetrics = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const formattedDate = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
    
    const [results] = await pool.query(`
        SELECT 
            COUNT(DISTINCT o.id) as online_orders_count,
            COALESCE(SUM(o.total_amount), 0) as online_total_sales,
            COALESCE(SUM(oi.quantity), 0) as online_items_sold,

            COUNT(DISTINCT w.id) as walkin_orders_count,
            COALESCE(SUM(w.total_amount), 0) as walkin_total_sales,
            COALESCE(SUM(wi.quantity), 0) as walkin_items_sold

        FROM (SELECT ? as date_filter) d
        LEFT JOIN orders o ON o.order_date >= d.date_filter
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN walk_in_sales w ON w.sale_date >= d.date_filter
        LEFT JOIN walk_in_sale_items wi ON w.id = wi.sale_id
    `, [formattedDate]);

    const metrics = results[0];
    
    const totalSales = parseFloat(metrics.online_total_sales) + parseFloat(metrics.walkin_total_sales);
    const totalItemsSold = parseInt(metrics.online_items_sold) + parseInt(metrics.walkin_items_sold);
    
    return {
        onlineOrdersLast7Days: metrics.online_orders_count,
        walkInOrdersLast7Days: metrics.walkin_orders_count,
        totalSalesLast7Days: totalSales,
        totalItemsSoldLast7Days: totalItemsSold
    };
};

module.exports = {
    getDashboardMetrics,
};