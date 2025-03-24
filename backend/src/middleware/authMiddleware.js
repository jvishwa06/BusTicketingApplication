const jwt = require('jsonwebtoken');
const logger = require('../utils/appLogger');
const { OperatorRepo } = require('../repositories/authRepository');

const authenticateOperator = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    logger.warn({ message: 'No token provided', path: req.path });
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const operator = await OperatorRepo.findById(decoded.operatorId);

    if (!operator) {
      logger.warn({ message: 'Operator not found', operatorId: decoded.operatorId });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (operator.status !== 'approved') {
      logger.warn({ message: 'Operator not approved', operatorId: decoded.operatorId });
      return res.status(403).json({ error: 'Account not approved' });
    }

    req.operator = operator;
    next();
  } catch (error) {
    logger.error({ message: 'Authentication error', error: error.message, stack: error.stack });
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateOperator };