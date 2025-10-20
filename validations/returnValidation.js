const Joi = require('joi');

// Should add more soon
const returnRequestSchema = Joi.object({
    reason: Joi.string().min(1).required().messages({
        'string.empty': 'Reason cannot be empty',
        'any.required': 'Reason is required',
    }),

    contact_number: Joi.string()
        .pattern(/^\d{9,11}$/)
        .required()
        .messages({
            'string.pattern.base': 'Contact number must be a valid number',
            'any.required': 'Contact number is required',
        }),
});

module.exports = { returnRequestSchema };
