const salesModel = require('../models/salesModel');
const dayjs = require('dayjs');

const formatSalesMetrics = (currentOnline, currentWalkIn, previousOnline, previousWalkIn) => {
    const formatMetrics = (online, walkIn) => ({
        onlineSales: {
            orderCount: online.online_orders_count,
            totalSales: parseInt(online.online_total_sales),
            itemsSold: parseInt(online.online_items_sold)
        },
        walkInSales: {
            orderCount: walkIn.walkin_orders_count,
            totalSales: parseInt(walkIn.walkin_total_sales),
            itemsSold: parseInt(walkIn.walkin_items_sold)
        },
        totals: {
            totalSales: parseInt(online.online_total_sales) + parseInt(walkIn.walkin_total_sales),
            totalItemsSold: parseInt(online.online_items_sold) + parseInt(walkIn.walkin_items_sold),
            totalOrders: parseInt(online.online_orders_count) + parseInt(walkIn.walkin_orders_count)
        }
    });

    return {
        current: formatMetrics(currentOnline, currentWalkIn),
        previous: formatMetrics(previousOnline, previousWalkIn)
    };
};

const getSalesMetricsForPeriod = async (currentStart, currentEnd, previousStart, previousEnd, periodKey) => {
    const [
        currentOnline,
        currentWalkIn,
        previousOnline,
        previousWalkIn,
        currentProductPerformance
    ] = await Promise.all([
        salesModel.fetchOnlineSalesMetrics(currentStart, currentEnd),
        salesModel.fetchWalkInSalesMetrics(currentStart, currentEnd),
        salesModel.fetchOnlineSalesMetrics(previousStart, previousEnd),
        salesModel.fetchWalkInSalesMetrics(previousStart, previousEnd),
        salesModel.fetchProductPerformance(currentStart, currentEnd)
    ]);
    
    return {
        [periodKey]: formatSalesMetrics(currentOnline, currentWalkIn, previousOnline, previousWalkIn),
        products: {
            bestSelling: currentProductPerformance.bestSelling.map(product => ({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantitySold: parseInt(product.total_quantity),
                revenue: parseFloat(product.total_revenue)
            })),
            leastSelling: currentProductPerformance.leastSelling.map(product => ({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantitySold: parseInt(product.total_quantity),
                revenue: parseFloat(product.total_revenue)
            }))
        }
    };
};

const getDailySalesMetrics = async () => {
    const currentStart = dayjs().startOf('day');
    const currentEnd = dayjs().endOf('day');

    const previousStart = dayjs().subtract(1, 'day').startOf('day');
    const previousEnd = dayjs().subtract(1, 'day').endOf('day');

    return getSalesMetricsForPeriod(
        currentStart.toDate(), 
        currentEnd.toDate(), 
        previousStart.toDate(), 
        previousEnd.toDate(), 
        'daily'
    );
};

const getWeeklySalesMetrics = async () => {
    const currentStart = dayjs().startOf('week').add(1, 'day'); 
    const currentEnd = dayjs().endOf('week').add(1, 'day'); 


    const previousStart = currentStart.subtract(1, 'week');
    const previousEnd = currentEnd.subtract(1, 'week');

    return getSalesMetricsForPeriod(
        currentStart.toDate(), 
        currentEnd.toDate(), 
        previousStart.toDate(), 
        previousEnd.toDate(), 
        'weekly'
    );
};

const getMonthlySalesMetrics = async () => {
    // Current month
    const currentStart = dayjs().startOf('month');
    const currentEnd = dayjs().endOf('month');

    const previousStart = dayjs().subtract(1, 'month').startOf('month');
    const previousEnd = dayjs().subtract(1, 'month').endOf('month');

    return getSalesMetricsForPeriod(
        currentStart.toDate(), 
        currentEnd.toDate(), 
        previousStart.toDate(), 
        previousEnd.toDate(), 
        'monthly'
    );
};

const getYearlySalesMetrics = async () => {
    // Current year
    const currentStart = dayjs().startOf('year');
    const currentEnd = dayjs().endOf('year');


    const previousStart = dayjs().subtract(1, 'year').startOf('year');
    const previousEnd = dayjs().subtract(1, 'year').endOf('year');

    return getSalesMetricsForPeriod(
        currentStart.toDate(), 
        currentEnd.toDate(), 
        previousStart.toDate(), 
        previousEnd.toDate(), 
        'yearly'
    );
};

module.exports = {
    getDailySalesMetrics,
    getWeeklySalesMetrics,
    getMonthlySalesMetrics,
    getYearlySalesMetrics
};