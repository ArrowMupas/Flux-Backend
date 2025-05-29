const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const requestSchema = Joi.object({
    order_id: Joi.string().max(50).required(),
    reason: Joi.string().max(255).required(),
}).unknown();

const validateRequest = validate(requestSchema);

module.exports = {
    validateRequest,
};
