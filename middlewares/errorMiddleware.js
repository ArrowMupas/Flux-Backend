const errorMiddleware = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    // Log the error message
    console.error(`Error: ${err.message}`);
    // Send error response
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: err.message,
        // Show stack trace only in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorMiddleware;
