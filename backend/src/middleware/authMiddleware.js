import jwt from 'jsonwebtoken';
import applogger from '../utils/appLogger.js';
import { UserRepo, OperatorRepo } from '../repositories/authRepository.js';

const authenticateOperatorandUser = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    applogger.warn({ message: 'No token provided', path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (req.originalUrl.startsWith('/api/users')) {
      const user = await UserRepo.findById(decoded.userId);
      if (!user) {
        applogger.warn({ message: 'User not found', userId: decoded.userId, ip: req.ip });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.blocked) {
        applogger.warn({ message: 'User is blocked', userId: decoded.userId, ip: req.ip });
        return res.status(403).json({ error: 'Your account is blocked' });
      }

      req.user = user;

    } else if (req.originalUrl.startsWith('/api/operators')) {
      const operator = await OperatorRepo.findById(decoded.operatorId);
      if (!operator) {
        applogger.warn({ message: 'Operator not found', operatorId: decoded.operatorId, ip: req.ip });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (operator.blocked) {
        applogger.warn({ message: 'Operator is blocked', operatorId: decoded.operatorId, ip: req.ip });
        return res.status(403).json({ error: 'Your account is blocked' });
      }

      req.operator = operator;
    } else {
      return res.status(404).json({ error: 'Route not found' });
    }

    next();
  } catch (error) {
    applogger.error({
      message: 'Authentication error',
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    res.status(401).json({ error: 'Invalid token' });
  }
};

export { authenticateOperatorandUser };
