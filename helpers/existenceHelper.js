const HttpError = require('./errorHelper');

// Ensure entity exists (e.g., user must be found)
const ensureExist = (entity, status = 404, message = 'Not found') => {
    if (!entity) {
        throw new HttpError(status, message);
    }
};

// Ensure entity does NOT exist (e.g., username/email must be unique)
const ensureNotExist = (entity, status = 409, message = 'Already exists') => {
    if (entity) {
        throw new HttpError(status, message);
    }
};

module.exports = {
    ensureExist,
    ensureNotExist,
};
