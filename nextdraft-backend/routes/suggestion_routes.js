const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateSuggestionsController,
  optimizeResumeController,
  getSuggestionsByResume,
  getSuggestionById,
  applySuggestionsController,
} = require("../controllers/suggestion_controller");

const router = express.Router();

// Generate suggestions for a resume + job description
// POST /api/suggestions/generate
router.post("/generate", protect, generateSuggestionsController);

// Generate and apply safe suggestions in one click
// POST /api/suggestions/optimize
router.post("/optimize", protect, optimizeResumeController);

// Apply suggestions to PDF and get download URL
// POST /api/suggestions/apply
router.post("/apply", protect, applySuggestionsController);

// Get all suggestions for a resume
// GET /api/suggestions/resume/:resumeId
router.get("/resume/:resumeId", protect, getSuggestionsByResume);

// Get a single suggestion by its ID
// GET /api/suggestions/:id
router.get("/:id", protect, getSuggestionById);

module.exports = router;
