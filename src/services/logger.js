const { createLogger, transports, format } = require('winston');
require('winston-daily-rotate-file');

const timezoned = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Calcutta'
    });
}

const customFormat = format.combine(format.timestamp({ format: timezoned }), format.printf((info) => {
    return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`
}))

const logger = createLogger({
    format: customFormat,
    transports: [
        new transports.Console({ level: 'silly' }),
        new transports.DailyRotateFile({
            filename: process.env.LOG_PATH,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            frequency: '7d',
            maxFiles: '15d',
            level: 'silly'
        })
    ]
});

module.exports = logger;

// const levels = {
//   error: 0,
//   warn: 1,
//   info: 2,
//   http: 3,
//   verbose: 4,
//   debug: 5,
//   silly: 6
// };