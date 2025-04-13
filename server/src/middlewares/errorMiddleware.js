import { appLogger } from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    appLogger.error(`${req.method} ${req.url} - ${message}`);

    const response = {
        success: false,
        message,
        ...(err.errors && { details: err.errors }), 
    };

    res.status(statusCode).json(response);
};

export default errorMiddleware;
