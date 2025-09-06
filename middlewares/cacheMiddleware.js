// This is a middleware based cache and is different from utility node cache
// This is a more simpler one while the node cache is much more complex
const apicache = require('apicache');
const cache = apicache.middleware;

/**
 * Returns a middleware for caching routes.
 * @param {string} duration - e.g. '10 seconds', '1 minute'
 */
function cacheRoute(duration = '10 seconds') {
    return cache(duration);
}

module.exports = cacheRoute;
