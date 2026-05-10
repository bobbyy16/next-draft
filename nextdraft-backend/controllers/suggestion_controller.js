const {
  generateResumeSuggestions,
  generateAndApplySuggestions,
  applySuggestionsToPdf,
} = require("../services/suggestion_service");
const Suggestion = require("../models/Suggestion_model");

const generateSuggestionsController = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
      return res.status(400).json({ message: "resumeId and jobId required" });
    }

    const suggestion = await generateResumeSuggestions(resumeId, jobId);
    res.status(201).json({ message: "Suggestions created", suggestion });
  } catch (error) {
    console.error("Suggestion error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to generate suggestions" });
  }
};

const optimizeResumeController = async (req, res) => {
  try {
    const { resumeId, jobDescriptionText, roleTitle, companyName } = req.body;
    if (!resumeId || !jobDescriptionText) {
      return res
        .status(400)
        .json({ message: "resumeId and jobDescriptionText required" });
    }

    const result = await generateAndApplySuggestions({
      resumeId,
      jobText: jobDescriptionText,
      roleTitle,
      companyName,
      userId: req.user._id,
    });

    res.status(200).json({
      message: "Resume optimized",
      ...result,
    });
  } catch (error) {
    console.error("Optimize resume error:", error);
    const status = error.message === "Not authorized" ? 403 : 500;
    res
      .status(status)
      .json({ message: error.message || "Failed to optimize resume" });
  }
};

const applySuggestionsController = async (req, res) => {
  try {
    const { suggestionId } = req.body;
    if (!suggestionId) {
      return res.status(400).json({ message: "suggestionId required" });
    }

    const editedPdfUrl = await applySuggestionsToPdf(suggestionId);
    res.status(200).json({ editedPdfUrl });
  } catch (error) {
    console.error("Apply suggestions error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to apply suggestions" });
  }
};

const getSuggestionsByResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const suggestions = await Suggestion.find({ resumeId }).sort({
      createdAt: -1,
    });
    res.status(200).json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

const getSuggestionById = async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion)
      return res.status(404).json({ message: "Suggestion not found" });
    res.status(200).json(suggestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch suggestion" });
  }
};

module.exports = {
  generateSuggestionsController,
  optimizeResumeController,
  applySuggestionsController,
  getSuggestionsByResume,
  getSuggestionById,
};
