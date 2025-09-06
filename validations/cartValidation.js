const Joi = require('joi');

const cartSchema = Joi.object({
    productId: Joi.string().max(50).required(),
    quantity: Joi.number().integer().min(1).required(),
}).unknown();

module.exports = {
    cartSchema,
};
