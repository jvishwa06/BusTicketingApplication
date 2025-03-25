const jwt = require('jsonwebtoken');
const logger = require('../utils/appLogger');
const { UserRepo, OperatorRepo } = require('../repositories/authRepository');

const authenticateOperator = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    logger.warn({ message: 'No token provided', path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (req.path.startsWith('/api/users')) {
      const user = await UserRepo.findById(decoded.userId);
      if (!user) {
        logger.warn({ message: 'User not found', userId: decoded.userId, ip: req.ip });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.blocked) {
        logger.warn({ message: 'User is blocked', userId: decoded.userId, ip: req.ip });
        return res.status(403).json({ error: 'Your account is blocked' });
      }

      req.user = user;
    } else if (req.path.startsWith('/api/operators')) {
      const operator = await OperatorRepo.findById(decoded.operatorId);
      if (!operator) {
        logger.warn({ message: 'Operator not found', operatorId: decoded.operatorId, ip: req.ip });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (operator.blocked) {
        logger.warn({ message: 'Operator is blocked', operatorId: decoded.operatorId, ip: req.ip });
        return res.status(403).json({ error: 'Your account is blocked' });
      }

      req.operator = operator;
    } else {
      return res.status(404).json({ error: 'Route not found' });
    }

    next();
  } catch (error) {
    logger.error({ message: 'Authentication error', error: error.message, stack: error.stack, ip: req.ip });
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateOperator };
