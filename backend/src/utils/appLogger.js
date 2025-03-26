const { createLogger, format, transports } = require('winston');
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` | ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

const appLogger = createLogger({
  level: 'info',
  defaultMeta: { service: 'auth-service' },
  format: fileFormat,
  transports: [
    new transports.File({
      filename: path.join(logDirectory, 'application.log'),
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true,
    }),
    new transports.Console({
      format: consoleFormat,
      level: 'debug',
    }),
  ],
});

if (process.env.NODE_ENV === 'test') {
  appLogger.silent = true;
}

if (process.env.NODE_ENV !== 'test') {
  appLogger.info({message: 'Logger initialized successfully',env: process.env.NODE_ENV || 'development',});
}

module.exports = appLogger;