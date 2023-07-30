const { loggers } = require("./starterFiles/logs");
const app = require('express')();

const starterFiles = (req, res, next) => {
    loggers(req, res, next);
};

module.exports = {
    starterFiles
};