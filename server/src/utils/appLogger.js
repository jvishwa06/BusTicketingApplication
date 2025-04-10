import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

const Logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: path.join(logDir, 'app.log') }), // Application logs
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }), // Error logs
    ],
});

// If not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    Logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

export default Logger;
