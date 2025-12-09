
const config = require('../config');

function errorHandler(err, req, res, next) { const status = err.status || 500;
  const payload = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  if (config.nodeEnv === 'development') {
    payload.stack = err.stack;
    if (err.details) payload.details = err.details;
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
