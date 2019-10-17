const winston = require('winston')
const path = require('path')
const fs = require('fs')
require('winston-daily-rotate-file');

const logDir = path.join(__dirname, 'logs');
fs.existsSync(logDir) || fs.mkdirSync(logDir);

let transports = process.env.NODE_ENV === 'production' ?
    [
        new (winston.transports.DailyRotateFile)({
            filename: 'logs/moretrees-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ] :
    [
        new winston.transports.Console({
            handleExceptions: true
        })
    ]

const winstonLogger = new winston.createLogger({ transports })

module.exports = winstonLogger
