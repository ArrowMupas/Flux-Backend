const smartInventoryNotifier = require('../helpers/smartInventoryNotifier');

const autoStockCheckMiddleware = (options = {}) => {
    const { 
        checkProducts = true, 
        checkBundles = false,
        skipRoutes = [] 
    } = options;

    return async (req, res, next) => {
        const originalJson = res.json;

        res.json = function(data) {
            const result = originalJson.call(this, data);

            if (res.statusCode >= 200 && res.statusCode < 300) {
                const shouldSkip = skipRoutes.some(route => req.path.includes(route));
                if (shouldSkip) {
                    return result;
                }


                setImmediate(async () => {
                    try {
                        if (checkProducts) {
                            await triggerProductStockCheck(req, data);
                        }
                        if (checkBundles) {
                            await triggerBundleStockCheck(req, data);
                        }
                    } catch (error) {
                        console.error('Error in auto stock check middleware:', error);
                    }
                });
            }

            return result;
        };

        next();
    };
};

const triggerProductStockCheck = async (req, responseData) => {
    try {
        let productIds = [];

        if (req.params.id || req.params.productId) {
            productIds.push(req.params.id || req.params.productId);
        }

        if (req.body?.product_id) {
            productIds.push(req.body.product_id);
        }
        if (req.body?.products && Array.isArray(req.body.products)) {
            productIds.push(...req.body.products.map(p => p.id || p.product_id).filter(Boolean));
        }

        if (responseData?.data?.id) {
            productIds.push(responseData.data.id);
        }
        if (responseData?.data?.product_id) {
            productIds.push(responseData.data.product_id);
        }

        productIds = [...new Set(productIds)];

        if (productIds.length === 0) {
            return;
        }

        const productModel = require('../models/productModel');
        for (const productId of productIds) {
            try {
                const product = await productModel.getProductById(productId);
                if (product) {
                    await smartInventoryNotifier.checkProductStock(product);
                }
            } catch (error) {
                console.error(` Error checking stock for product ${productId}:`, error);
            }
        }
    } catch (error) {
        console.error(' Error in product stock check trigger:', error);
    }
};

const triggerBundleStockCheck = async (req, responseData) => {
    try {
        let productIds = [];

        if (req.params.id || req.params.productId) {
            productIds.push(req.params.id || req.params.productId);
        }
        if (req.body?.product_id) {
            productIds.push(req.body.product_id);
        }

        productIds = [...new Set(productIds)];

        if (productIds.length === 0) {
            return;
        }

        const bundleModel = require('../models/bundleModel');
        
        for (const productId of productIds) {
            try {
                const affectedBundles = await bundleModel.getBundlesByProductId(productId);
                
                for (const bundle of affectedBundles) {
                    const bundleItems = await bundleModel.getBundleItemsWithProducts(bundle.bundle_id);
                    await smartInventoryNotifier.checkBundleStock(bundle, bundleItems);
                }
            } catch (error) {
                console.error(` Error checking bundles for product ${productId}:`, error);
            }
        }
    } catch (error) {
        console.error(' Error in bundle stock check trigger:', error);
    }
};

const orderCompletionStockMiddleware = () => {
    return async (req, res, next) => {
        const originalJson = res.json;

        res.json = function(data) {
            const result = originalJson.call(this, data);

            if (res.statusCode >= 200 && res.statusCode < 300) {
                setImmediate(async () => {
                    try {
                        if (req.body?.status === 'cancelled' || req.body?.status === 'refunded') {
                            await checkAndResolveStockNotifications(req.params.id);
                        }
                    } catch (error) {
                        console.error(' Error in order completion stock middleware:', error);
                    }
                });
            }

            return result;
        };

        next();
    };
};


const checkAndResolveStockNotifications = async (orderId) => {
    try {
        const orderModel = require('../models/orderModel');
        const orderItems = await orderModel.getOrderItems(orderId);

        const productModel = require('../models/productModel');
        
        for (const item of orderItems) {
            const product = await productModel.getProductById(item.product_id);
            if (!product) continue;

            const { LOW_STOCK, CRITICAL_STOCK } = smartInventoryNotifier.STOCK_THRESHOLDS;
            
            if (product.stock_quantity > LOW_STOCK) {
                await smartInventoryNotifier.resolveStockNotification(
                    'product', 
                    product.id
                );
            }
        }
    } catch (error) {
        console.error(' Error checking stock notification resolution:', error);
    }
};

module.exports = {
    autoStockCheckMiddleware,
    orderCompletionStockMiddleware
};
