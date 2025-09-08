const smartInventoryNotifier = require('../helpers/smartInventoryNotifier');
const productModel = require('../models/productModel');

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
        if (this.isRunning || !this.options.enableAutoCheck) {
            return;
        }

        this.isRunning = true;
        this.runStockCheck();

        this.intervalId = setInterval(() => {
            this.runStockCheck();
        }, this.options.checkInterval);
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async runStockCheck() {
        try {
            const products = await productModel.getAllProducts();
            await smartInventoryNotifier.checkMultipleProducts(products);
        } catch (error) {
            console.error('Error in scheduled stock check:', error);
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            checkInterval: this.options.checkInterval,
            enableAutoCheck: this.options.enableAutoCheck,
            nextCheck: this.isRunning ? new Date(Date.now() + this.options.checkInterval) : null,
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
    }
}

const inventoryStockChecker = new InventoryStockChecker();

const initializeStockChecker = () => {
    setTimeout(() => {
        inventoryStockChecker.start();
    }, 5000);
};

module.exports = {
    InventoryStockChecker,
    inventoryStockChecker,
    initializeStockChecker,
};
