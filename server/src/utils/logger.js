import winston from 'winston';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), 
  winston.format.json()
);

const appLogger = winston.createLogger({
  level: 'info',
  format,
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'application.log') }),
    ...(!process.env.NODE_ENV || process.env.NODE_ENV !== 'production' ? [new winston.transports.Console()] : [])
  ]
});

morgan.token('timestamp', () => new Date().toISOString()); 

const requestLogger = morgan(
  (tokens, req, res) => JSON.stringify({
    timestamp: tokens.timestamp(req, res), 
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res) || '0'),
    responseTime: parseFloat(tokens['response-time'](req, res) || '0')
  }),
  {
    stream: fs.createWriteStream(path.join(logDir, 'requests.log'), { flags: 'a' })
  }
);

export { appLogger, requestLogger };
