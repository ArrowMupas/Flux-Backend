const Joi = require('joi');

const bundleSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    price: Joi.number().positive().required(),
    is_active: Joi.boolean().default(true),
    items: Joi.array()
        .items(
            Joi.object({
                product_id: Joi.string().required(),
                quantity: Joi.number().min(1).required(),
            })
        )
        .min(1)
        .required(),
});

module.exports = { bundleSchema };
