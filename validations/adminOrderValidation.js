const Joi = require('joi');

const statusUpdateSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded', 'returned')
        .required(),
    notes: Joi.string().allow('').optional(),
}).unknown();

module.exports = {
    statusUpdateSchema,
};
