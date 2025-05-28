const Joi = require('joi');
const validate = require('../helpers/validateHelper');

// Schema of status update
const statusUpdateSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded')
        .required(),
    notes: Joi.string().optional(),
});

const validateStatusUpdate = validate(statusUpdateSchema);

module.exports = {
    validateStatusUpdate,
};
