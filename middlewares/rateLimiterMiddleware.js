const rateLimit = require('express-rate-limit');

// General limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Login-specific limiter (No brute force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // max 5 login attempts
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    loginLimiter,
};
