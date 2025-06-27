const HttpError = require('../helpers/errorHelper');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const message = error.details.map((detail) => detail.message).join(', ');
        return next(new HttpError(400, message));
    }

    next();
};

module.exports = validate;
// Class for validating joi schema
