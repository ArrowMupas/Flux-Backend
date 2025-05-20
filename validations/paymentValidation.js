const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const paymentSchema = Joi.object({
    order_id: Joi.number().integer().positive().required(),
    method: Joi.string().valid('GCash', 'Maya', 'bank_transfer').required(),
    reference_number: Joi.string().max(100).required(),
    account_name: Joi.string().max(100).optional(),
    address: Joi.string().max(255).required(),
});

const validatePayment = validate(paymentSchema);

module.exports = {
    validatePayment,
};
