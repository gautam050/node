const express = require('express');
const bodyParser = require('express').json;

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');

const app = express();
app.use(bodyParser());

app.use('/auth', authRoutes);
app.use('/todos', todoRoutes);

module.exports = app;
