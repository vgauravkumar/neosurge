/**
 * NOTE: Here the validations are without required. Hence on the necesecity, add required at the place of use
 */

const Joi = require('joi');

const validate = {
    name: Joi.string().max(150),
    email_id: Joi.string().email().max(150),
    otp: Joi.number().min(100000).max(999999),
    password: Joi.string()
        .min(8) // Minimum password length of 8 characters
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@\\-$!#_])[A-Za-z\\d@$\\-$!#_]{8,}$'))
        .messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one of the following special characters: @, -, $, #, or _.',
            'string.min': 'Password must be at least {#limit} characters long.',
        }),
};

module.exports = validate;