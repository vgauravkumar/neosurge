const Joi = require('joi');

const postExpenseValidator = (obj) => {
    const JoiSchemaBody = Joi.object({
        amount: Joi.number().greater(0).required().messages({
            'number.base': 'Amount must be a number',
            'number.greater': 'Amount must be greater than 0',
            'any.required': 'Amount is required'
        }),
        notes: Joi.string().max(150).required().messages({
            'string.base': 'Notes must be a string',
            'string.empty': 'Notes cannot be empty',
            'string.max': 'Notes must be less than or equal to 150 characters',
            'any.required': 'Notes is required'
        }),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format',
            'any.required': 'Date is required'
        })
    });

    const { error } = JoiSchemaBody.validate(obj);
    if (error) return error.details[0].message;
};

const putExpenseValidator = (obj) => {
    const JoiSchemaBody = Joi.object({
        expense_id: Joi.number().integer().positive().required().messages({
            'number.base': 'Expense ID must be a number',
            'number.integer': 'Expense ID must be an integer',
            'number.positive': 'Expense ID must be a positive number',
            'any.required': 'Expense ID is required'
        }),
        amount: Joi.number().greater(0).required().messages({
            'number.base': 'Amount must be a number',
            'number.greater': 'Amount must be greater than 0',
            'any.required': 'Amount is required'
        }),
        notes: Joi.string().max(150).required().messages({
            'string.base': 'Notes must be a string',
            'string.empty': 'Notes cannot be empty',
            'string.max': 'Notes must be less than or equal to 150 characters',
            'any.required': 'Notes is required'
        }),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format',
            'any.required': 'Date is required'
        })
    });

    const { error } = JoiSchemaBody.validate(obj);
    if (error) return error.details[0].message;
};

const deleteExpenseValidator = (obj) => {
    const schema = Joi.object({
        expense_id: Joi.number().integer().positive().required().messages({
            'number.base': 'Expense ID must be a number',
            'number.integer': 'Expense ID must be an integer',
            'number.positive': 'Expense ID must be a positive number',
            'any.required': 'Expense ID is required'
        })
    });

    const { error } = schema.validate(obj);
    if (error) return error.details[0].message;
};

module.exports = {
    postExpenseValidator,
    putExpenseValidator,
    deleteExpenseValidator
};