const {
  generateResumeSuggestions,
  generateAndApplySuggestions,
  applySuggestionsToPdf,
} = require("../services/suggestion_service");
const Suggestion = require("../models/Suggestion_model");
const Resume = require("../models/Resume_model");
const JobDescription = require("../models/JobDescription_model");

const ensureResumeOwnership = async (resumeId, userId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) return { error: { status: 404, message: "Resume not found" } };
  if (String(resume.userId) !== String(userId)) {
    return { error: { status: 403, message: "Not authorized" } };
  }
  return { resume, error: null };
};

const ensureSuggestionOwnership = async (suggestionId, userId) => {
  const suggestion = await Suggestion.findById(suggestionId);
  if (!suggestion) return { error: { status: 404, message: "Suggestion not found" } };
  const resume = await Resume.findById(suggestion.resumeId);
  if (!resume || String(resume.userId) !== String(userId)) {
    return { error: { status: 403, message: "Not authorized" } };
  }
  return { suggestion, resume, error: null };
};

const generateSuggestionsController = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
      return res.status(400).json({ message: "resumeId and jobId required" });
    }

    const { resume, error } = await ensureResumeOwnership(resumeId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const job = await JobDescription.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job description not found" });
    if (String(job.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to use this job description" });
    }

    const suggestion = await generateResumeSuggestions(resume._id, job._id);
    return res.status(201).json({ message: "Suggestions created", suggestion });
  } catch (error) {
    console.error("[Suggestion] generate error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to generate suggestions" });
  }
};

const optimizeResumeController = async (req, res) => {
  try {
    const { resumeId, jobDescriptionText, roleTitle, companyName } = req.body;
    if (!resumeId || !jobDescriptionText) {
      return res.status(400).json({ message: "resumeId and jobDescriptionText required" });
    }
    if (typeof jobDescriptionText !== "string" || jobDescriptionText.trim().length < 40) {
      return res.status(400).json({
        message: "Paste a complete job description (at least 40 characters) before running AI optimize",
      });
    }
    if (jobDescriptionText.length > 20000) {
      return res.status(400).json({ message: "Job description is too long (max 20,000 chars)" });
    }

    const { error } = await ensureResumeOwnership(resumeId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const result = await generateAndApplySuggestions({
      resumeId,
      jobText: jobDescriptionText,
      roleTitle: typeof roleTitle === "string" ? roleTitle.slice(0, 120) : "",
      companyName: typeof companyName === "string" ? companyName.slice(0, 120) : "",
      userId: req.user._id,
    });

    return res.status(200).json({ message: "Resume optimized", ...result });
  } catch (error) {
    console.error("[Suggestion] optimize error:", error.message);
    const status =
      error.message === "Not authorized"
        ? 403
        : error.message?.startsWith("Not enough points")
        ? 402
        : 500;
    return res.status(status).json({ message: error.message || "Failed to optimize resume" });
  }
};

const applySuggestionsController = async (req, res) => {
  try {
    const { suggestionId } = req.body;
    if (!suggestionId) {
      return res.status(400).json({ message: "suggestionId required" });
    }
    const { suggestion, error } = await ensureSuggestionOwnership(suggestionId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const editedPdfUrl = await applySuggestionsToPdf(suggestion._id);
    return res.status(200).json({ editedPdfUrl });
  } catch (error) {
    console.error("[Suggestion] apply error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to apply suggestions" });
  }
};

const getSuggestionsByResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { error } = await ensureResumeOwnership(resumeId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const suggestions = await Suggestion.find({ resumeId }).sort({ createdAt: -1 });
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("[Suggestion] list error:", error.message);
    return res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

const getSuggestionById = async (req, res) => {
  try {
    const { suggestion, error } = await ensureSuggestionOwnership(req.params.id, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });
    return res.status(200).json(suggestion);
  } catch (error) {
    console.error("[Suggestion] get error:", error.message);
    return res.status(500).json({ message: "Failed to fetch suggestion" });
  }
};

module.exports = {
  generateSuggestionsController,
  optimizeResumeController,
  applySuggestionsController,
  getSuggestionsByResume,
  getSuggestionById,
};
