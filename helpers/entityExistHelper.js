const HttpError = require('./errorHelper');

const checkEntityExist = (entity, res, status = 404, message = 'Not found') => {
    if (!entity) {
        throw new HttpError(404, message);
    }
};

module.exports = checkEntityExist;
// Checks if an entity exist
