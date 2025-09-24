const salesModel = require('../models/salesModel');

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

const getWeeklySalesMetrics = async () => {
    // Current week
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 7);
    const currentEnd = new Date();

    // Previous week
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);

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
        weekly: formatSalesMetrics(currentOnline, currentWalkIn, previousOnline, previousWalkIn),
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

const getMonthlySalesMetrics = async () => {
    // Current month
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 30);
    const currentEnd = new Date();

    // Previous month
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);

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
        monthly: formatSalesMetrics(currentOnline, currentWalkIn, previousOnline, previousWalkIn),
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

module.exports = {
    getWeeklySalesMetrics,
    getMonthlySalesMetrics
};