const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Define log directory outside src (in backend root)
const logDirectory = path.join(__dirname, '../../logs');

// Create logs directory if it doesn’t exist
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create write stream for request logs
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'request.log'), { flags: 'a' });

// Handle stream errors
accessLogStream.on('error', (err) => {
  console.error('Error writing to request.log:', err);
});

const requestLogger = morgan('combined', { stream: accessLogStream });

if (process.env.NODE_ENV === 'test') {
  requestLogger.silent = true; // Silence logger in test environment
}

module.exports = requestLogger;