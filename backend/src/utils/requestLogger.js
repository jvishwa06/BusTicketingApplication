const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'request.log'), { flags: 'a' });

accessLogStream.on('error', (err) => {
  console.error('Error writing to request.log:', err);
});

const requestLogger = morgan('combined', { stream: accessLogStream });

if (process.env.NODE_ENV === 'test') {
  requestLogger.silent = true; 
}

module.exports = requestLogger;