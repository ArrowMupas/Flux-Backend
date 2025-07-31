const Joi = require('joi');

const couponSchema = Joi.object({
    code: Joi.string().trim().max(50).required().label('Coupon code'),

    description: Joi.string().allow('', null).max(255).label('Description'),

    discount_type: Joi.string()
        .valid('percentage', 'fixed', 'special')
        .required()
        .label('Discount type'),

    discount_value: Joi.when('discount_type', {
        is: Joi.valid('percentage', 'fixed'),
        then: Joi.number().positive().required().label('Discount value'),
        otherwise: Joi.valid(null).required().label('Discount value'),
    }),

    is_active: Joi.boolean().default(true).label('Is Active'),

    starts_at: Joi.date().required().label('Start Date'),

    expires_at: Joi.date().greater(Joi.ref('starts_at')).required().label('End Date'),

    usage_limit: Joi.number().integer().positive().allow(null).label('Usage limit'),

    per_user_limit: Joi.number().integer().positive().allow(null).label('Per user limit'),
});

module.exports = {
    couponSchema,
};
