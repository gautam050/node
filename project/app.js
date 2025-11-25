const express = require("express");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user.routes");
const profileRoutes = require("./routes/profile.routes");

const app = express();
app.use(express.json());

// Routes
app.use("/", userRoutes);
app.use("/", profileRoutes);

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/oneToOne")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

module.exports = app;
