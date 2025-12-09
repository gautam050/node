
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/todos-dev',
  jwtSecret: process.env.JWT_SECRET || 'change_this_in_production',
  jwtExpiry: process.env.JWT_EXPIRY || '1d',
};
