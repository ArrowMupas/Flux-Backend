const Joi = require('joi');

// Older validation schema for status update with 'status' field
const statusUpdateSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded', 'returned')
        .required(),
    notes: Joi.string().allow('').optional(),
}).unknown();

const updateStatusSchema = Joi.object({
    notes: Joi.string().allow('').max(255).messages({
        'string.base': 'Notes must be a string',
        'string.max': 'Notes cannot exceed 255 characters',
    }),
});

module.exports = {
    statusUpdateSchema,
    updateStatusSchema,
};
