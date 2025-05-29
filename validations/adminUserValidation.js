const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const usernameRegex = /^[a-zA-Z][A-Za-z0-9-_]{7,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z\d]{8,}$/;

const registerSchema = Joi.object({
    username: Joi.string().pattern(usernameRegex).required().messages({
        'string.pattern.base':
            'Username must be 8-15 characters long, start with a letter, and contain only alphanumeric characters, hyphens, or underscores.',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address.',
    }),
    password: Joi.string().pattern(passwordRegex).required().messages({
        'string.pattern.base':
            'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.',
    }),
    role: Joi.number().valid(1, 2, 3).required().messages({
        'any.only': 'Role must be one of the following values: 1, 2, or 3.',
    }),
}).unknown();

const userSchema = Joi.object({
    username: Joi.string().min(8).max(50).required(),
    email: Joi.string().email().max(100).required(),
    address: Joi.string().max(255).optional(),
    contact_number: Joi.string()
        .pattern(/^\+?[0-9]{7,15}$/)
        .message('Contact number must be a valid international format')
        .optional(),
    role_id: Joi.valid('1', '2', '3').required(),
}).unknown();

const statusSchema = Joi.object({
    is_active: Joi.boolean().required(),
}).unknown();

const validateStatus = validate(statusSchema);
const validateUserCreation = validate(userSchema);
const validateRegister = validate(registerSchema);

module.exports = {
    validateUserCreation,
    validateRegister,
    validateStatus,
};
