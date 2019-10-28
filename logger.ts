import { createLogger, format, transports, Logger, LoggerOptions } from 'winston'
import path from 'path'
import fs from 'fs'
import { Format } from 'logform';
import DailyRotateFile from 'winston-daily-rotate-file'

const logDir = path.join(__dirname, 'logs');
fs.existsSync(logDir) || fs.mkdirSync(logDir);

let transportsArray = process.env.NODE_ENV === 'production' ?
    [
        new DailyRotateFile({
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

let options: LoggerOptions = {
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
}


const winstonLogger: Logger = createLogger(options)

export = winstonLogger
