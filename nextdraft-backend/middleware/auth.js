const jwt = require("jsonwebtoken");
const User = require("../models/User_model");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    if (user.status === "banned") {
      return res.status(403).json({
        message: "Account suspended. Contact support if you believe this is a mistake.",
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

const ownerOnly = (paramKey = "id") => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (req.user.role === "admin") return next();
  if (String(req.user._id) !== String(req.params[paramKey])) {
    return res.status(403).json({ message: "Not authorized to access this resource" });
  }
  return next();
};

module.exports = { protect, adminOnly, ownerOnly };
