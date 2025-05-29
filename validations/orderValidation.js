const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const checkoutSchema = Joi.object({
    payment_method: Joi.string().valid('GCash', 'Maya', 'bank_transfer').required(),
    address: Joi.string().max(255).required(),
    notes: Joi.string().allow('').max(255),
    reference_number: Joi.string().max(50).required(),
    account_name: Joi.string().max(100),
});

const validateCheckout = validate(checkoutSchema);

module.exports = {
    validateCheckout,
};
