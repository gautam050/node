const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: 'Too many password reset attempts from this IP, please try again later',
});

module.exports = { forgotPasswordLimiter };
