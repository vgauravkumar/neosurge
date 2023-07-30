const { Database } = require('../../services/db');
const logger = require('../../services/logger');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('../../helper/authenticationModule/auth');
const issueJWT = require('../../helper/authenticationModule/authenticator');
const { loginValidator } = require('../../validation/authenticationModule/login');

const login = async (req, res) => {
    try {
        const error = loginValidator(req.body);
        if (error) {
            return res.status(400).json({
                seccess: false,
                message: error
            });
        }
        const { email_id, password } = req.body;
        const userInfo = await getUserByEmail(email_id);
        if (!userInfo) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }
        const DB = new Database();
        const userHash = await DB.query(`SELECT hash FROM user_cred WHERE user_id = ${userInfo.user_id};`);
        const isValid = await bcrypt.compare(password, userHash[0].hash);
        if (!isValid) {
            DB.close();
            return res.status(401).json({
                success: false,
                message: "Wrong password"
            });
        }
        const { token } = issueJWT(userInfo.user_id);
        return res.status(200).header('jwt', token).json({
            success: true,
            message: "Logged in successfully"
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
    login
};