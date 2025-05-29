const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const productSchema = Joi.object({
    id: Joi.string().max(10).required(),
    name: Joi.string().max(100).required(),
    category: Joi.string().max(50).required(),
    stock_quantity: Joi.number().integer().min(0).required(),
    price: Joi.number().min(0).required(),
    image: Joi.string().max(255).required(),
    description: Joi.string().max(500).optional().allow(''),
}).unknown();

const updateProductSchema = Joi.object({
    id: Joi.string().max(10).required(),
    name: Joi.string().max(100).required(),
    category: Joi.string().max(50).optional(),
    stock_quantity: Joi.number().integer().min(0).required(),
    price: Joi.number().min(0).required(),
    image: Joi.string().max(255).optional(),
    description: Joi.string().max(500).optional().allow(''),
    is_active: Joi.boolean().required(),
}).unknown();

const validateProduct = validate(productSchema);
const validateProductUpdate = validate(updateProductSchema);

module.exports = {
    validateProduct,
    validateProductUpdate,
};
