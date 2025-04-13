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
    winston.format.printf(({ timestamp, level, message, stack, method, url, status, responseTime, clientIp, userAgent, processId, userId, sessionId, requestId }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}] - ${message}`;
        if (method && url) logMessage += ` - Method: ${method} - URL: ${url}`;
        if (status) logMessage += ` - Status: ${status}`;
        if (responseTime) logMessage += ` - Response Time: ${responseTime}ms`;
        if (clientIp) logMessage += ` - Client IP: ${clientIp}`;
        if (userAgent) logMessage += ` - User-Agent: ${userAgent}`;
        if (processId) logMessage += ` - Process ID: ${processId}`;
        if (userId) logMessage += ` - User ID: ${userId}`;
        if (sessionId) logMessage += ` - Session ID: ${sessionId}`;
        if (requestId) logMessage += ` - Request ID: ${requestId}`;
        if (stack) logMessage += ` - Stack Trace: ${stack}`;
        return logMessage;
    })
);

const appLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: appLogPath })
    ],
});

const httpRequestLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: requestLogPath })
    ],
});

if (process.env.NODE_ENV !== 'production') {
    appLogger.add(new winston.transports.Console());
    httpRequestLogger.add(new winston.transports.Console());
}

const requestLogger = morgan(
    ':method :url :status :res[content-length] - :response-time ms - :remote-addr - :user-agent',
    {
        stream: {
            write: (message) => {
                const parts = message.trim().split(' - ');
                const requestParts = parts[0].split(' ');
                
                const method = requestParts[0];
                const url = requestParts[1];
                const status = parseInt(requestParts[2]);
                const responseTime = parseFloat(parts[1].replace(' ms', ''));
                const clientIp = parts[2];
                const userAgent = parts.length > 3 ? parts[3] : 'Unknown';
                
                httpRequestLogger.info(`${method} ${url}`, {
                    status,
                    responseTime,
                    clientIp,
                    userAgent
                });
            }
        }
    }
);

export { appLogger, requestLogger };
