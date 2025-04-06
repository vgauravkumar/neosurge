const logger = require('../../services/logger');
const loggers = (req, res, next) => {
    const header = req.header("Authorization");
    if (header) {
        if(req.originalUrl.endsWith("/api/expenses") && req.method != "GET") {
            logger.info(`[${req.ip}] [${header.slice(0, 10)}..]: [${req.method}] ${req.originalUrl} - ${JSON.stringify(req.body)}}`);
        } else {
            logger.info(`[${req.ip}] [${header.slice(0, 10)}..]: [${req.method}] ${req.originalUrl}}`);
        }
    } else
        logger.info(`[${req.ip}] [NULL]: [${req.method}] ${req.originalUrl}`)
    logger.info(`DBC: ${global["DBC"]}`);
    // Pass to next layer of middleware
    next();
};

module.exports = {
    loggers
};