import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

export function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: messages,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      code: 'CAST_ERROR',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      code: 'DUPLICATE_ERROR',
    });
  }

  const status = err.status || err.statusCode || 500;
  const response = {
    error: status === 500 ? 'Internal server error' : err.message,
    code: err.code || 'SERVER_ERROR',
  };

  if (config.nodeEnv !== 'production') {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
}
