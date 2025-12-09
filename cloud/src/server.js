// src/server.js
const http = require('http');
const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');

async function start() {
  try {
    if (!config.mongoUri) {
      throw new Error('MONGO_URI not configured');
    }
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const server = http.createServer(app);
    server.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = { start };
