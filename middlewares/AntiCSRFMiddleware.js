const csrfProtection = (req, res, next) => {
    const csrfHeader = req.header('X-Flux-CSRF');
    if (csrfHeader !== 'flux-client') {
        console.log('CSRF B');
        return res.status(403).json({ message: 'CSRF validation failed' });
    }
    next();
};

module.exports = { csrfProtection };
