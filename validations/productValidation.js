const Joi = require('joi');

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
    price: Joi.number().min(0).required(),
    image: Joi.string().max(255).optional(),
    description: Joi.string().max(500).optional().allow(''),
}).unknown();

const statusSchema = Joi.object({
    is_active: Joi.boolean().truthy('true').falsy('false').required(),
}).unknown();

const restockSchema = Joi.object({
    restock_quantity: Joi.number().integer().min(1).strict().required(),
    price: Joi.number().positive().precision(2).strict().required(),
});

module.exports = {
    productSchema,
    updateProductSchema,
    statusSchema,
    restockSchema,
};
