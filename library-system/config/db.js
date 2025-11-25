const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/library");
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error:", error);
  }
};

module.exports = connectDB;
