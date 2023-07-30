const { Database } = require('../../services/db');

const getUserByEmail = async (email_id) => {
    const DB = new Database();
    const users = await DB.query(`SELECT * FROM user_login WHERE email_id = "${email_id}";`);
    DB.close();
    if (!users.length) {
        return false;
    } else {
        return users[0];
    }
};

const getUserById = async (user_id) => {
    const DB = new Database();
    const users = await DB.query(`SELECT * FROM user_login WHERE user_id = ${user_id};`);
    DB.close();
    if (!users.length) {
        return false;
    } else {
        return users[0];
    }
};

module.exports = {
    getUserByEmail,
    getUserById
};