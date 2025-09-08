const rateLimit = require('express-rate-limit');

const maxGeneralLimit = process.env.NODE_ENV === 'development' ? 400 : 100;

// General limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxGeneralLimit,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const maxLoginAttempts = process.env.NODE_ENV === 'development' ? 40 : 5;

// Login-specific limiter (No brute force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxLoginAttempts, // max 5 login attempts
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    loginLimiter,
};
