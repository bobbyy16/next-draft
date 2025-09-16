const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Resume = require("../models/Resume_model");

// -------------------- UPLOAD RESUME --------------------
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `resumes/${req.user._id}`,
      resource_type: "raw",
    });

    // Read file for parsing
    let parsedText = "";
    let originalText = "";

    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      parsedText = data.text;
      originalText = data.text;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const data = await mammoth.extractRawText({ path: req.file.path });
      parsedText = data.value;
      originalText = data.value;
    }

    // Clean up local file
    fs.unlinkSync(req.file.path);

    // Save to DB
    const resume = await Resume.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      parsedText,
      originalText,
      version: 1,
      isEdited: false,
    });

    res.status(201).json({ message: "Resume uploaded & parsed", resume });
  } catch (error) {
    console.error("Resume upload error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Resume upload failed" });
  }
};

// -------------------- GET ALL RESUMES --------------------
const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(resumes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve resumes" });
  }
};

// -------------------- GET RESUME BY ID --------------------
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.status(200).json(resume);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve resume" });
  }
};

// -------------------- DELETE RESUME --------------------
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(
      `resumes/${req.user._id}/${resume.fileName}`,
      { resource_type: "raw" }
    );

    await Resume.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Resume deletion failed" });
  }
};

module.exports = { uploadResume, getAllResumes, getResumeById, deleteResume };
