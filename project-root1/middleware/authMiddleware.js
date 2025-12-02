const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer "))
      token = authHeader.split(" ")[1];
    if (!token && req.cookies && req.cookies.Authorization) {
      const cookieVal = req.cookies.Authorization;
      if (cookieVal.startsWith("Bearer ")) token = cookieVal.split(" ")[1];
      else token = cookieVal;
    }
    if (!token) return res.status(401).json({ message: "Missing token" });
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select("-password");
    if (!user)
      return res.status(401).json({ message: "Invalid token: user not found" });
    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token", details: err.message });
  }
};
module.exports = authenticate;
