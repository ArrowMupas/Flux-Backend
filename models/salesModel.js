const pool = require('../database/pool');
const dayjs = require('dayjs');

const fetchOnlineSalesMetrics = async (startDate, endDate, connection = pool) => {
    const [orderResults] = await connection.query(`
        SELECT
            COUNT(DISTINCT id) as online_orders_count,
            COALESCE(SUM(total_amount), 0) as online_total_sales
        FROM orders 
        WHERE order_date BETWEEN ? AND ?
          AND status IN ('pending', 'processing', 'shipping', 'delivered')
    `, [dayjs(startDate).format('YYYY-MM-DD'), dayjs(endDate).format('YYYY-MM-DD 23:59:59')]);

    const [itemsResults] = await connection.query(`
        SELECT COALESCE(SUM(oi.quantity), 0) as online_items_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_date BETWEEN ? AND ?
          AND o.status IN ('pending', 'processing', 'shipping', 'delivered')
    `, [dayjs(startDate).format('YYYY-MM-DD'), dayjs(endDate).format('YYYY-MM-DD 23:59:59')]);

    return {
        ...orderResults[0],
        ...itemsResults[0]
    };
};

const fetchWalkInSalesMetrics = async (startDate, endDate, connection = pool) => {

    //Get orders and total (Needs to be seperated so it will not dup because of the JOIN or Im just dumb XD)
    const [orderResults] = await connection.query(`
        SELECT
            COUNT(DISTINCT id) as walkin_orders_count,
            COALESCE(SUM(total_amount), 0) as walkin_total_sales
        FROM walk_in_sales 
        WHERE sale_date BETWEEN ? AND ?
    `, [dayjs(startDate).format('YYYY-MM-DD'), dayjs(endDate).format('YYYY-MM-DD 23:59:59')]);

    // Get items sold 
    const [itemsResults] = await connection.query(`
        SELECT COALESCE(SUM(wi.quantity), 0) as walkin_items_sold
        FROM walk_in_sale_items wi
        JOIN walk_in_sales w ON wi.sale_id = w.id
        WHERE w.sale_date BETWEEN ? AND ?
    `, [dayjs(startDate).format('YYYY-MM-DD'), dayjs(endDate).format('YYYY-MM-DD 23:59:59')]);

    return {
        ...orderResults[0],
        ...itemsResults[0]
    };
};

const fetchProductPerformance = async (startDate, endDate, limit = 5, connection = pool) => {
    const formattedStart = dayjs(startDate).format('YYYY-MM-DD');
    const formattedEnd = dayjs(endDate).format('YYYY-MM-DD 23:59:59');

    const [results] = await connection.query(`
        WITH combined_sales AS (
            -- Online sales
            SELECT 
                p.id,
                p.name,
                p.price,
                COALESCE(SUM(oi.quantity), 0) as quantity_sold,
                COALESCE(SUM(oi.subtotal), 0) as total_sales
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.order_date BETWEEN ? AND ?
              AND o.status IN ('pending', 'processing', 'shipping', 'delivered')
            GROUP BY p.id

            UNION ALL

            -- Walk-in sales
            SELECT 
                p.id,
                p.name,
                p.price,
                COALESCE(SUM(wi.quantity), 0) as quantity_sold,
                COALESCE(SUM(wi.subtotal), 0) as total_sales
            FROM products p
            LEFT JOIN walk_in_sale_items wi ON p.id = wi.product_id
            LEFT JOIN walk_in_sales w ON wi.sale_id = w.id
            WHERE w.sale_date BETWEEN ? AND ?
            GROUP BY p.id
        )
        SELECT 
            id,
            MAX(name) as name,
            MAX(price) as price,
            SUM(quantity_sold) as total_quantity,
            SUM(total_sales) as total_revenue
        FROM combined_sales
        GROUP BY id
        ORDER BY total_quantity DESC
    `, [formattedStart, formattedEnd, formattedStart, formattedEnd]);

    // Get best and least selling products
    const bestSelling = results.slice(0, limit);
    const leastSelling = results.slice(-limit).reverse();

    return {
        bestSelling,
        leastSelling
    };
};

module.exports = {
    fetchOnlineSalesMetrics,
    fetchWalkInSalesMetrics,
    fetchProductPerformance
};