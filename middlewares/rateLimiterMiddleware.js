const rateLimit = require('express-rate-limit');

// General limiter (100 requests per 15 minutes)
const maxGeneralLimit = process.env.NODE_ENV === 'development' ? 400 : 100;
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxGeneralLimit,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Login-specific limiter
const maxLoginAttempts = process.env.NODE_ENV === 'development' ? 40 : 10; // Change to 5 later
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxLoginAttempts, // max 5 login attempts
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Ordering-specific limiter (No brute force)
const maxOrderAttempts = process.env.NODE_ENV === 'development' ? 40 : 10; // Change to 5 later
const orderLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: maxOrderAttempts,
    message: 'Too many orders today, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    loginLimiter,
    orderLimiter,
};
