const logger = require('../../services/logger');
const { getUserById } = require('../../helper/authenticationModule/auth');
const { Database } = require('../../services/db');

const userDetail = async (req, res) => {
    try {
        const userInfo = await getUserById(req.user.user_id);
        return res.status(200).json({
            success: true,
            data: userInfo
        });
    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: err
        });
    }
};

const userDetailAll = async (req, res) => {
    try {
        const DB = new Database();
        const usersInfo = await DB.query(`SELECT * FROM user_login;`);
        DB.close();
        return res.status(200).json({
            success: true,
            data: usersInfo
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
    userDetail,
    userDetailAll
};