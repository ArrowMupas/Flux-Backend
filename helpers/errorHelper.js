class HttpError extends Error {
    constructor(status, message, errorFields = null) {
        super(message);
        this.status = status;
        if (errorFields) {
            this.error = errorFields;
        }
    }
}

module.exports = HttpError;

// Class for sending HTTP errors
