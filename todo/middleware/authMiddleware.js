const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

module.exports = (req, res, next) => {
  const header = req.headers['authorization'] || "";

  if (!header.startsWith("Bearer "))
    return res.status(401).json({ message: "missing token" });

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: "invalid token" });
  }
};
