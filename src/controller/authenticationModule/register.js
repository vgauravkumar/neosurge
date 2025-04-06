const { Database } = require('../../services/db');
const logger = require('../../services/logger');
const bcrypt = require('bcrypt');
const { registerValidator } = require('../../validation/authenticationModule/register');
const { getUserByEmail } = require('../../helper/authenticationModule/auth');
const { generateOTP } = require('../../helper/misc/random');

const register = async (req, res) => {
    try {
        // validation
        const errorMessage = registerValidator(req.body);
        if (errorMessage) {
            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
        // buisness logic
        const { name, email_id, password } = req.body;
        const userExists = await getUserByEmail(email_id);
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }
        const DB = new Database();
        const hash = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        console.log("OTP sent to the user:", otp);
        const insertUserQuery = await DB.query(`INSERT INTO user_login (name, email_id, otp) VALUES ("${name}", "${email_id}", ${otp});`);
        if (!insertUserQuery.affectedRows) {
            DB.close();
            return res.status(500).json({
                success: false,
                message: "Could not add user in Database"
            });
        }
        await DB.query(`INSERT INTO user_cred (user_id, hash) VALUES (${insertUserQuery.insertId}, "${hash}");`);
        DB.close();
        return res.status(200).json({
            success: true,
            message: "User registered"
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
    register
};