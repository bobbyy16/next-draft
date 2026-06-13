const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/user_controller");
const { protect, ownerOnly } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const upload = require("../middleware/upload");
const {
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require("../middleware/rate_limit");

// Auth
router.post("/register", registerLimiter, upload.single("profileImage"), registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// Current user
router.get("/me", protect, getMe);

// By ID — self or admin only
router.get("/:id", protect, validateObjectId("id"), ownerOnly("id"), getUser);
router.put(
  "/:id",
  protect,
  validateObjectId("id"),
  ownerOnly("id"),
  upload.single("profileImage"),
  updateUser
);
router.delete("/:id", protect, validateObjectId("id"), ownerOnly("id"), deleteUser);

module.exports = router;
