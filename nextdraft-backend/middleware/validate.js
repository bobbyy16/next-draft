const mongoose = require("mongoose");

const isValidObjectId = (id) =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);

const validateObjectId = (paramKey = "id") => (req, res, next) => {
  if (!isValidObjectId(req.params[paramKey])) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  return next();
};

const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

const stripAndTrim = (value, max) => {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(CONTROL_CHARS, "").trim();
  return max ? cleaned.slice(0, max) : cleaned;
};

const isValidEmail = (email) =>
  typeof email === "string" &&
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

module.exports = {
  isValidObjectId,
  validateObjectId,
  stripAndTrim,
  isValidEmail,
  isStrongPassword,
};
