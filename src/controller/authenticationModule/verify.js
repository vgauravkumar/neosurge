const { Database } = require('../../services/db');
const logger = require('../../services/logger');
const { verifyValidator } = require('../../validation/authenticationModule/verify');
const { getUserByEmail } = require('../../helper/authenticationModule/auth');

const verify = async (req, res) => {
    try {
        // validation
        const errorMessage = verifyValidator(req.body);
        if (errorMessage) {
            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
        // buisness logic
        const { email_id, otp } = req.body;
        const userExists = await getUserByEmail(email_id);
        if (userExists && !userExists.is_verified && userExists.otp == otp) {
            const DB = new Database();
            await DB.query(`UPDATE user_login SET otp = NULL, is_verified = 1 WHERE user_id = ${userExists.user_id}`);
            DB.close();
            return res.status(200).json({
                success: true,
                message: "User verified successfully"
            });
        }
        return res.status(400).json({
            success: true,
            message: "OTP invalid"
        });
    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: err
        });
    }
};

module.exports = {
    verify
};