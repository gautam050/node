const bcrypt = require("bcrypt");
const User = require("../models/User");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const SALT_ROUNDS = 10;
exports.signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "User already exists" });
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      username,
      email,
      password: hashed,
      role: role === "admin" ? "admin" : "user",
    });
    return res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    const payload = { sub: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    user.refreshTokens.push({ token: refreshToken });
    if (user.refreshTokens.length > 10) {
      user.refreshTokens = user.refreshTokens.slice(-10);
    }
    await user.save();
    return res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refresh token" });
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ message: "User not found" });
    const exists = user.refreshTokens.some((rt) => rt.token === refreshToken);
    if (!exists)
      return res.status(401).json({ message: "Refresh token revoked" });
    const payload = { sub: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== refreshToken
    );
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();
    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refresh token" });
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
      return res.status(200).json({ message: "Logged out" });
    }
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(200).json({ message: "Logged out" });
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== refreshToken
    );
    await user.save();
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
