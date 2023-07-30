const mysql = require('mysql2');
// require('dotenv').config();

const configurationVariables = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    multipleStatements: true,
    // charset:"utf8mb4" // For allowing emojis in DB
};

class Database {
    constructor() {
        this.connection = mysql.createConnection(configurationVariables);
        global["DBC"]++;
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {

            this.connection.query(sql, args, (err, rows) => {
                if (err) {
                    global["DBC"]--;
                    this.connection.end(err => {
                        if (err) {
                            return reject(err);
                        }
                    })
                    return reject(err);
                }

                resolve(rows);
            });

        });
    }
    close() {
        global["DBC"]--;
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}

module.exports = { Database };
