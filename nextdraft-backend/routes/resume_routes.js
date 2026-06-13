const express = require("express");
const { protect } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const upload = require("../middleware/upload_resume");
const {
  uploadResume,
  deleteResume,
  getAllResumes,
  getResumeById,
  updateResume,
} = require("../controllers/resume_controller");

const router = express.Router();

router.post("/upload", protect, upload.single("resume"), uploadResume);
router.get("/", protect, getAllResumes);
router.get("/:id", protect, validateObjectId("id"), getResumeById);
router.patch("/:id", protect, validateObjectId("id"), updateResume);
router.delete("/:id", protect, validateObjectId("id"), deleteResume);

module.exports = router;
