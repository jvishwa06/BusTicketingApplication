import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

// Create Winston logger instance
const Logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
    ],
});

// If not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    Logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

export default Logger;
