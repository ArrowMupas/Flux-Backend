const Joi = require('joi');

const couponSchema = Joi.object({
    code: Joi.string().max(50).required(),
    description: Joi.string().allow('', null),
    type: Joi.string().valid('PERCENTAGE', 'FIXED', 'SPECIAL').required(),
    amount: Joi.number().min(0).allow(null),
    is_active: Joi.boolean().default(true),
    start_date: Joi.date().required(),
    end_date: Joi.date().greater(Joi.ref('start_date')).required(),
});

module.exports = {
    couponSchema,
};
