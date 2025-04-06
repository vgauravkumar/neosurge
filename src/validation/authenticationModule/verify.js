const Joi = require('joi');
const validate = require('../standard');

const verifyValidator = (obj) => {
    const JoiSchemaBody = Joi.object({
        email_id: validate.email_id.required(),
        otp: validate.otp.required()
    });
    const { error } = JoiSchemaBody.validate(obj);
    if (error) return error.details[0].message;
};

module.exports = {
    verifyValidator
}