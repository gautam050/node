const mongoose = require("mongoose");
const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshTokens: [refreshTokenSchema],
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
