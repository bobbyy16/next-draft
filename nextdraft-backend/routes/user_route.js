const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
} = require("../controllers/user_controller");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Registration with file upload
router.post("/register", upload.single("profileImage"), registerUser);

// Login
router.post("/login", loginUser);

// Get all users
router.get("/", protect, getAllUsers);

// Get user by ID
router.get("/:id", protect, getUser);

// Update user
router.put("/:id", protect, upload.single("profileImage"), updateUser);

// Delete user
router.delete("/:id", protect, deleteUser);

module.exports = router;
