const Joi = require('joi');
const validate = require('../helpers/validateHelper');

const usernameRegex = /^[a-zA-Z][A-Za-z0-9-_]{7,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z\d]{8,}$/;

const registerSchema = Joi.object({
    username: Joi.string().pattern(usernameRegex).required().messages({
        'string.pattern.base':
            'Username must be 8-15 characters long and contain only alphanumeric characters, hyphens, and underscores.',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address.',
    }),
    password: Joi.string().pattern(passwordRegex).required().messages({
        'string.pattern.base':
            'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.',
    }),
});

const loginSchema = Joi.object({
    username: Joi.string().alphanum().min(7).max(15).required().messages({
        'string.alphanum': 'Username must only contain letters and numbers.',
        'string.min': 'Username must be at least 8 characters long.',
        'any.required': 'Username is required.',
    }),

    password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long.',
        'any.required': 'Password is required.',
    }),
});

const resetPasswordSchema = Joi.object({
    username: Joi.string().alphanum().min(4).max(15).required().messages({
        'string.alphanum': 'Username must only contain letters and numbers.',
        'string.min': 'Username must be at least 4 characters long.',
        'string.max': 'Username must not exceed 15 characters.',
    }),

    password: Joi.string().pattern(passwordRegex).required().messages({
        'string.pattern.base':
            'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
    }),

    newPassword: Joi.string()
        .pattern(passwordRegex)
        .invalid(Joi.ref('password'))
        .required()
        .messages({
            'string.pattern.base':
                'New password must be at least 8 characters and include uppercase, lowercase, and a number.',
            'any.invalid': 'New password must be different from the current password.',
        }),

    confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Confirm password must match the new password.',
    }),
});

const updateUserSchema = Joi.object({
    username: Joi.string().alphanum().min(8).max(15).required().messages({
        'string.alphanum': 'Username must only contain letters and numbers.',
        'string.min': 'Username must be at least 8 characters long.',
        'string.max': 'Username must not exceed 15 characters.',
        'any.required': 'Username is required.',
    }),

    address: Joi.string().min(5).max(100).messages({
        'string.min': 'Address must be at least 5 characters.',
        'string.max': 'Address is too long.',
    }),

    contact_number: Joi.string()
        .pattern(/^\+?\d{10,15}$/)
        .messages({
            'string.pattern.base':
                'Contact number must be a valid phone number (10–15 digits, optional +).',
        }),
});

const emailSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.',
    }),
});

const confirmResetPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.',
    }),

    newPassword: Joi.string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)
        .required()
        .messages({
            'string.pattern.base':
                'New password must be at least 8 characters, include uppercase, lowercase, and a number.',
            'any.required': 'New password is required.',
        }),

    confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Confirm password must match new password.',
        'any.required': 'Confirm password is required.',
    }),
});

const validateRegistration = validate(registerSchema);
const validatePasswordReset = validate(resetPasswordSchema);
const validateLogin = validate(loginSchema);
const validateUserUpdate = validate(updateUserSchema);
const validateEmail = validate(emailSchema);
const validateConfirmPasswordReset = validate(confirmResetPasswordSchema);

module.exports = {
    validateRegistration,
    validatePasswordReset,
    validateLogin,
    validateUserUpdate,
    validateEmail,
    validateConfirmPasswordReset,
};
