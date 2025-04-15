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
    winston.format.printf(({ timestamp, level, message, stack }) => {
        let logMessage = `${timestamp} [${level}] - ${message}`;
        if (stack) logMessage += ` - Stack Trace: ${stack}`;
        return logMessage;
    })
);

const appLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: appLogPath }),
        ...(process.env.NODE_ENV !== 'production' ? [new winston.transports.Console()] : []),
    ],
});

const httpRequestLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: requestLogPath }),
        ...(process.env.NODE_ENV !== 'production' ? [new winston.transports.Console()] : []),
    ],
});

const requestLogger = morgan(':method :url :status :response-time ms - :remote-addr - :user-agent', {
    stream: {
        write: (message) => {
            const [method, url, status, , responseTime, clientIp, userAgent] = message.trim().split(' ');

            httpRequestLogger.info(`${method} ${url}`, {
                status,
                responseTime: parseFloat(responseTime), 
                clientIp,
                userAgent
            });
        },
    },
});

export { appLogger, requestLogger };
