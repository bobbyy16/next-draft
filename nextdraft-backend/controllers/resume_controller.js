const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Resume = require("../models/Resume_model");
const Suggestion = require("../models/Suggestion_model");

const MAX_RESUMES = 5;
const MAX_TEXT = 60000; // ~30 single-spaced pages

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("[Upload] cleanup failed:", err.message);
  }
};

const ensureOwnership = (resource, userId) => {
  if (!resource) return { error: { status: 404, message: "Resume not found" } };
  if (String(resource.userId) !== String(userId)) {
    return { error: { status: 403, message: "Not authorized" } };
  }
  return { error: null };
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    const resumeCount = await Resume.countDocuments({ userId: req.user._id });
    if (resumeCount >= MAX_RESUMES) {
      safeUnlink(req.file.path);
      return res.status(400).json({
        message: `You can upload up to ${MAX_RESUMES} resumes. Delete one to upload another.`,
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `resumes/${req.user._id}`,
      resource_type: "raw",
    });

    let parsedText = "";
    let originalText = "";

    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      parsedText = (data.text || "").slice(0, MAX_TEXT);
      originalText = parsedText;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const data = await mammoth.extractRawText({ path: req.file.path });
      parsedText = (data.value || "").slice(0, MAX_TEXT);
      originalText = parsedText;
    }

    safeUnlink(req.file.path);

    const resume = await Resume.create({
      userId: req.user._id,
      fileName: req.file.originalname.slice(0, 200),
      fileUrl: result.secure_url,
      cloudinaryPublicId: result.public_id || "",
      parsedText,
      originalText,
      version: 1,
      isEdited: false,
    });

    return res.status(201).json({ message: "Resume uploaded & parsed", resume });
  } catch (error) {
    console.error("[Resume] upload error:", error.message);
    safeUnlink(req.file?.path);
    return res.status(500).json({ message: "Resume upload failed" });
  }
};

const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(resumes);
  } catch (error) {
    console.error("[Resume] list error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve resumes" });
  }
};

const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    const { error } = ensureOwnership(resume, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });
    return res.status(200).json(resume);
  } catch (error) {
    console.error("[Resume] get error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve resume" });
  }
};

const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    const { error } = ensureOwnership(resume, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    if (resume.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(resume.cloudinaryPublicId, { resource_type: "raw" });
      } catch (err) {
        console.error("[Cloudinary] resume delete:", err.message);
      }
    }

    await Suggestion.deleteMany({ resumeId: resume._id });
    await Resume.findByIdAndDelete(resume._id);
    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("[Resume] delete error:", error.message);
    return res.status(500).json({ message: "Resume deletion failed" });
  }
};

const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    const { error } = ensureOwnership(resume, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const { parsedText, isEdited } = req.body;
    if (parsedText !== undefined) {
      if (typeof parsedText !== "string") {
        return res.status(400).json({ message: "Invalid resume text" });
      }
      resume.parsedText = parsedText.slice(0, MAX_TEXT);
    }
    if (isEdited !== undefined) resume.isEdited = Boolean(isEdited);
    resume.version += 1;
    await resume.save();

    return res.status(200).json({ message: "Resume updated", resume });
  } catch (error) {
    console.error("[Resume] update error:", error.message);
    return res.status(500).json({ message: "Resume update failed" });
  }
};

module.exports = { uploadResume, getAllResumes, getResumeById, deleteResume, updateResume };
