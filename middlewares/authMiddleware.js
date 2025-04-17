const jwt = require('jsonwebtoken');

// Verify Token Middleware
const verifyToken = (req, res, next) => {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;

        jwt.verify(req.token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }
            req.user = decoded; // Attach decoded payload to request
            next();
        });
    } else {
        res.status(403).json({ message: 'Token is required' });
    }
};

module.exports = verifyToken;
