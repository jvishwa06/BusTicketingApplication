import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default requestLogger;