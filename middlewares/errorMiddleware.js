const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.status || 500;

    // Log the error message
    console.error(`Error: ${err.message}`);
    // Send error response
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: err.message,
        error: err.error || undefined,
        // Show stack trace only in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorMiddleware;
