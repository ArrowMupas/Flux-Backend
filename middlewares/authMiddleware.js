const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader =
        authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!req.cookies) {
        console.warn(
            'Warning: req.cookies is undefined. Did you forget to use cookie-parser middleware?'
        );
    }

    const tokenFromCookie = req.cookies?.token || null;

    const tryVerify = (token) => {
        try {
            return jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            return null;
        }
    };

    let decoded = null;

    if (tokenFromHeader) {
        decoded = tryVerify(tokenFromHeader);
    }

    if (!decoded && tokenFromCookie) {
        decoded = tryVerify(tokenFromCookie);
    }

    if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
};

module.exports = verifyToken;
