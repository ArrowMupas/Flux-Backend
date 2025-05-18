const Joi = require('joi');
const validate = require('../helpers/validateHelper');

// Schema of status update
const statusUpdateSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
        .required(),
    notes: Joi.string().optional(),
});

// Trying out joi
const validateStatusUpdate = validate(statusUpdateSchema);

module.exports = {
    validateStatusUpdate,
};
