// cache.js
const NodeCache = require('node-cache');

// Default TTL (in seconds) if none is provided
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const setCache = (key, value, ttl) => {
    // If ttl is provided, use it.
    cache.set(key, value, ttl);
};

const getCache = (key) => {
    return cache.get(key);
};

const invalidateCache = (key) => {
    cache.del(key);
};

const clearCache = () => {
    cache.flushAll();
};

module.exports = {
    setCache,
    getCache,
    invalidateCache,
    clearCache,
};
