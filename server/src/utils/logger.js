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
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        if (typeof message === 'string' && Object.keys(metadata).length === 0) {
            return `${timestamp} [${level}] - ${message}`;
        }
        
        if (message && typeof message === 'object' && message.message) {
            const { message: msg, ...rest } = message;
            return `${timestamp} [${level}] - ${msg} | ${JSON.stringify(rest)}`;
        }
        
        if (typeof message === 'object') {
            return `${timestamp} [${level}] - ${message.message || 'Event'} | ${JSON.stringify(message)}`;
        }
        
        if (Object.keys(metadata).length > 0) {
            return `${timestamp} [${level}] - ${message} | ${JSON.stringify(metadata)}`;
        }
        
        return `${timestamp} [${level}] - ${message}`;
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

const requestLogger = morgan(':method :url :status - :remote-addr - :user-agent', {
    stream: {
        write: (message) => {
            const [method, url, status, , clientIp, , ...userAgentParts] = message.trim().split(' ');
            const userAgent = userAgentParts.join(' ');
            httpRequestLogger.info(`${method} ${url}`, {
                status,
                clientIp,
                userAgent,
            });
        },
    },
});

export { appLogger, requestLogger };
