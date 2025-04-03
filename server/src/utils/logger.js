import winston from 'winston';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

const logDirectory = path.join('logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const requestLogPath = path.join(logDirectory, 'requests.log');
const appLogPath = path.join(logDirectory, 'application.log');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: appLogPath }) 
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console());
}

const requestLogger = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message) => {
                winston.createLogger({
                    format: logFormat,
                    transports: [
                        new winston.transports.File({ filename: requestLogPath }) 
                    ],
                }).info(message.trim());
            },
        },
    }
);

export { logger, requestLogger };
