const { createLogger, format, transports } = require('winston');
const path = require('path')
const fs = require('fs')
require('winston-daily-rotate-file');

const logDir = path.join(__dirname, 'logs');
fs.existsSync(logDir) || fs.mkdirSync(logDir);

let transportsArray = process.env.NODE_ENV === 'production' ?
    [
        new (transports.DailyRotateFile)({
            filename: 'logs/moretrees-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ] :
    [
        new transports.Console({
            handleExceptions: true
        })
    ]

const winstonLogger = new createLogger({
    format: format.combine(
        format.colorize(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message}`
        })
    ),
    transports: transportsArray
})

module.exports = winstonLogger
