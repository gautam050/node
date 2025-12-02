const permit =
  (...allowedRoles) =>
  (req, res, next) => {
    const { user } = req;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    if (!allowedRoles.includes(user.role))
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    next();
  };
module.exports = { permit };
