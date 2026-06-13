const JobDescription = require("../models/JobDescription_model");

const MAX_JD = 20000;
const MAX_TITLE = 120;
const MAX_KEYWORD = 50;
const MAX_KEYWORDS = 20;

const sanitizeText = (value, max) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
};

const sanitizeKeywords = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_KEYWORD))
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS);
};

const ensureOwnership = (resource, userId) => {
  if (!resource) return { error: { status: 404, message: "Job description not found" } };
  if (String(resource.userId) !== String(userId)) {
    return { error: { status: 403, message: "Not authorized" } };
  }
  return { error: null };
};

const uploadJobDescription = async (req, res) => {
  try {
    const text = sanitizeText(req.body.text, MAX_JD);
    if (!text) {
      return res.status(400).json({ message: "Job description text is required" });
    }

    const job = await JobDescription.create({
      userId: req.user._id,
      parsedText: text,
      roleTitle: sanitizeText(req.body.roleTitle, MAX_TITLE),
      companyName: sanitizeText(req.body.companyName, MAX_TITLE),
      keywords: sanitizeKeywords(req.body.keywords),
    });

    return res.status(201).json({ message: "Job description uploaded successfully", job });
  } catch (error) {
    console.error("[JD] upload error:", error.message);
    return res.status(500).json({ message: "Failed to upload job description" });
  }
};

const getAllJobDescriptions = async (req, res) => {
  try {
    const jobs = await JobDescription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(jobs);
  } catch (error) {
    console.error("[JD] list error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve job descriptions" });
  }
};

const getJobDescriptionById = async (req, res) => {
  try {
    const job = await JobDescription.findById(req.params.id);
    const { error } = ensureOwnership(job, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });
    return res.status(200).json(job);
  } catch (error) {
    console.error("[JD] get error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve job description" });
  }
};

const deleteJobDescription = async (req, res) => {
  try {
    const job = await JobDescription.findById(req.params.id);
    const { error } = ensureOwnership(job, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });
    await job.deleteOne();
    return res.status(200).json({ message: "Job description deleted successfully" });
  } catch (error) {
    console.error("[JD] delete error:", error.message);
    return res.status(500).json({ message: "Failed to delete job description" });
  }
};

const updateJobDescription = async (req, res) => {
  try {
    const job = await JobDescription.findById(req.params.id);
    const { error } = ensureOwnership(job, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const text = sanitizeText(req.body.text, MAX_JD);
    if (!text) {
      return res.status(400).json({ message: "Job description text is required" });
    }

    job.parsedText = text;
    job.roleTitle = sanitizeText(req.body.roleTitle, MAX_TITLE);
    job.companyName = sanitizeText(req.body.companyName, MAX_TITLE);
    job.keywords = sanitizeKeywords(req.body.keywords);

    await job.save();
    return res.status(200).json({ message: "Job description updated successfully", job });
  } catch (error) {
    console.error("[JD] update error:", error.message);
    return res.status(500).json({ message: "Failed to update job description" });
  }
};

module.exports = {
  uploadJobDescription,
  getAllJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
  updateJobDescription,
};
