const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Get 'authentication' header value
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {

        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;

        jwt.verify(req.token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }
            req.user = decoded;
            next();
        });
    } else {
        res.status(403).json({ message: 'Token is required' });
    }
};

module.exports = verifyToken;
