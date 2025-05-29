const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const cartSchema = Joi.object({
    productId: Joi.string().max(50).required(),
    quantity: Joi.number().integer().min(1).required(),
}).unknown();

const validateCartItem = validate(cartSchema);

module.exports = {
    validateCartItem,
};
