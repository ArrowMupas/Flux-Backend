const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const statusUpdateSchema = Joi.object({
    status: Joi.string()
        .valid(
            'pending',
            'processing',
            'shipping',
            'delivered',
            'cancelled',
            'refunded',
            'returned'
        )
        .required(),
    notes: Joi.string().allow('').optional(),
}).unknown();

const validateStatusUpdate = validate(statusUpdateSchema);

module.exports = {
    validateStatusUpdate,
};
