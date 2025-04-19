const sendResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        statusCode: statusCode,
        status: String(statusCode).startsWith('2') ? 'success' : 'error',
        message: message,
        data: data,
    });
};

module.exports = sendResponse;
