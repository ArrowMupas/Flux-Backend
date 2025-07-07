const HttpError = require('../helpers/errorHelper');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        // Combined message for top-level error
        const message = error.details.map((detail) => detail.message).join(', ');

        // Object mapping field -> message
        const errorFields = {};
        error.details.forEach((detail) => {
            const field = detail.path.join('.');
            errorFields[field] = detail.message;
        });

        return next(new HttpError(400, message, errorFields));
    }

    next();
};

module.exports = validate;
// Class for validating joi schema
