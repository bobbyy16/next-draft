// controllers/jobDescription_controller.js
const JobDescription = require("../models/JobDescription_model");

const uploadJobDescription = async (req, res) => {
  try {
    const { text, roleTitle, companyName, keywords } = req.body;

    if (!text || text.trim().length === 0) {
      return res
        .status(400)
        .json({ message: "Job description text is required" });
    }

    const job = await JobDescription.create({
      userId: req.user._id,
      parsedText: text.trim(),
      roleTitle: roleTitle || "",
      companyName: companyName || "",
      keywords: Array.isArray(keywords) ? keywords : [],
    });

    res.status(201).json({
      message: "Job Description uploaded successfully",
      job,
    });
  } catch (error) {
    console.error("Upload JD error:", error);
    res.status(500).json({ message: "Failed to upload Job Description" });
  }
};

const getAllJobDescriptions = async (req, res) => {
  try {
    const jobs = await JobDescription.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Get all JDs error:", error);
    res.status(500).json({ message: "Failed to retrieve job descriptions" });
  }
};

const getJobDescriptionById = async (req, res) => {
  try {
    const job = await JobDescription.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job Description not found" });
    }
    if (job.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this JD" });
    }
    res.status(200).json(job);
  } catch (error) {
    console.error("Get JD by ID error:", error);
    res.status(500).json({ message: "Failed to retrieve job description" });
  }
};

const deleteJobDescription = async (req, res) => {
  try {
    const job = await JobDescription.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job Description not found" });
    }

    // Ensure user owns this JD
    if (job.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this JD" });
    }

    await job.deleteOne();

    res.status(200).json({ message: "Job Description deleted successfully" });
  } catch (error) {
    console.error("Delete JD error:", error);
    res.status(500).json({ message: "Failed to delete job description" });
  }
};

module.exports = {
  uploadJobDescription,
  getAllJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
};
