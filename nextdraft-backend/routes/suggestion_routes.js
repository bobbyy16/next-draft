const express = require("express");
const { protect } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const { aiLimiter } = require("../middleware/rate_limit");
const {
  generateSuggestionsController,
  optimizeResumeController,
  getSuggestionsByResume,
  getSuggestionById,
  applySuggestionsController,
} = require("../controllers/suggestion_controller");

const router = express.Router();

router.post("/generate", protect, aiLimiter, generateSuggestionsController);
router.post("/optimize", protect, aiLimiter, optimizeResumeController);
router.post("/apply", protect, applySuggestionsController);
router.get("/resume/:resumeId", protect, validateObjectId("resumeId"), getSuggestionsByResume);
router.get("/:id", protect, validateObjectId("id"), getSuggestionById);

module.exports = router;
