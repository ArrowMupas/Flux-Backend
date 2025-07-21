const sendResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        statusCode,
        status: String(statusCode).startsWith('2') ? 'success' : 'error',
        message,
        data,
    });
};

module.exports = sendResponse;
