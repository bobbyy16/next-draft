const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateSuggestionsController,
  getSuggestionsByResume,
  getSuggestionById,
} = require("../controllers/suggestion_controller");

const router = express.Router();

// Generate suggestions for a resume + job description
// POST /api/suggestions/generate
router.post("/generate", protect, generateSuggestionsController);

// Get all suggestions for a resume
// GET /api/suggestions/resume/:resumeId
router.get("/resume/:resumeId", protect, getSuggestionsByResume);

// Get a single suggestion by its ID
// GET /api/suggestions/:id
router.get("/:id", protect, getSuggestionById);

module.exports = router;
