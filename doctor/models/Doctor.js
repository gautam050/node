const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("Doctor", doctorSchema);
