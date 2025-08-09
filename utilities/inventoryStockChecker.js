const smartInventoryNotifier = require('../helpers/smartInventoryNotifier');
const productModel = require('../models/productModel');
const bundleModel = require('../models/bundleModel');

class InventoryStockChecker {
    constructor(options = {}) {
        this.isRunning = false;
        this.intervalId = null;
        this.options = {
            checkInterval: options.checkInterval || 30 * 60 * 1000, 
            enableAutoCheck: options.enableAutoCheck || true,
            logResults: options.logResults !== false, 
        };
    }

    start() {
        if (this.isRunning) {
            console.log(' Inventory stock checker is already running');
            return;
        }

        if (!this.options.enableAutoCheck) {
            console.log(' Automated stock checking is disabled');
            return;
        }

        this.isRunning = true;
        console.log(` Starting inventory stock checker (every ${this.options.checkInterval / 1000 / 60} minutes)`);
        
        this.runStockCheck();

        this.intervalId = setInterval(() => {
            this.runStockCheck();
        }, this.options.checkInterval);
    }

    stop() {
        if (!this.isRunning) {
            console.log(' Inventory stock checker is not running');
            return;
        }

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('📦 Inventory stock checker stopped');
    }

    async runStockCheck() {
        try {
            if (this.options.logResults) {
                console.log('📦 Starting scheduled inventory stock check...');
            }

            const startTime = Date.now();
            
            const products = await productModel.getAllProducts();
            await smartInventoryNotifier.checkMultipleProducts(products);

            const bundles = await bundleModel.getAllBundles();
            const bundlesWithItems = await Promise.all(
                bundles.map(async (bundle) => {
                    const items = await bundleModel.getBundleItemsWithProducts(bundle.bundle_id);
                    return { bundle, items };
                })
            );
            await smartInventoryNotifier.checkMultipleBundles(bundlesWithItems);

            const duration = Date.now() - startTime;
            
            if (this.options.logResults) {
                console.log(` Scheduled inventory stock check completed in ${duration}ms`);
                console.log(` Checked: ${products.length} products, ${bundles.length} bundles`);
            }

        } catch (error) {
            console.error('Error in scheduled stock check:', error);
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            checkInterval: this.options.checkInterval,
            enableAutoCheck: this.options.enableAutoCheck,
            nextCheck: this.isRunning ? new Date(Date.now() + this.options.checkInterval) : null
        };
    }

    updateInterval(newInterval) {
        const wasRunning = this.isRunning;
        
        if (wasRunning) {
            this.stop();
        }
        
        this.options.checkInterval = newInterval;
        
        if (wasRunning) {
            this.start();
        }
        
        console.log(` Stock check interval updated to ${newInterval / 1000 / 60} minutes`);
    }
}

const inventoryStockChecker = new InventoryStockChecker();

const initializeStockChecker = (options = {}) => {
    setTimeout(() => {
        inventoryStockChecker.start();
    }, 5000); 
};

module.exports = {
    InventoryStockChecker,
    inventoryStockChecker,
    initializeStockChecker
};
