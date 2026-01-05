const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: "India" },
  pincode: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true
  },
  age: { type: Number, required: true },
  addresses: [addressSchema]
});

module.exports = mongoose.model("User", userSchema);
