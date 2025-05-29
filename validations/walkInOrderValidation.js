const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const itemSchema = Joi.object({
    product_id: Joi.string().max(10).required(),
    quantity: Joi.number().integer().min(1).required(),
});

const WalkInOderSchema = Joi.object({
    customer_name: Joi.string().max(100).required(),
    customer_email: Joi.string().email().max(100).required(),
    notes: Joi.string().max(255).optional().allow(''),
    discount_amount: Joi.number().min(0).precision(2).required(),
    items: Joi.array().items(itemSchema).min(1).required(),
});

const validateWalkInOrder = validate(WalkInOderSchema);

module.exports = {
    validateWalkInOrder,
};
