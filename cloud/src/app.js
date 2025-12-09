
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json());
if (config.nodeEnv === 'development') app.use(morgan('dev'));



app.get('/health', (req, res) => res.json({ ok: true }));

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(errorHandler);

module.exports = app;
