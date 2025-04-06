const Joi = require('joi');
const validate = require('../standard');

const registerValidator = (obj) => {
    const JoiSchemaBody = Joi.object({
        name: validate.name.required(),
        email_id: validate.email_id.required(),
        password: validate.password.required()
    });
    const { error } = JoiSchemaBody.validate(obj);
    if (error) return error.details[0].message;
};

module.exports = {
    registerValidator
}