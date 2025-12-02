require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());


app.use('/api/auth', authRoutes);


app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true, useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
  }
}
start();
