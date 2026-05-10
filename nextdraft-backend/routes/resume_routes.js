const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload_resume");
const {
  uploadResume,
  deleteResume,
  getAllResumes,
  getResumeById,
  updateResume,
} = require("../controllers/resume_controller");

const router = express.Router();

// Upload resume
router.post("/upload", protect, upload.single("resume"), uploadResume);

// Get all resumes of logged-in user
router.get("/", protect, getAllResumes);

// Get resume by ID
router.get("/:id", protect, getResumeById);

// Update resume parsed text (PATCH)
router.patch("/:id", protect, updateResume);

// Delete resume
router.delete("/:id", protect, deleteResume);

module.exports = router;
