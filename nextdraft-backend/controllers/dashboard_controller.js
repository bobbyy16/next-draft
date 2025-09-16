const Resume = require("../models/Resume_model");
const JobDescription = require("../models/JobDescription_model");
const Suggestion = require("../models/Suggestion_model");

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalResumes = await Resume.countDocuments({ userId });
    const totalJobDescriptions = await JobDescription.countDocuments({
      userId,
    });
    const totalSuggestions = await Suggestion.countDocuments({
      resumeId: { $in: (await Resume.find({ userId })).map((r) => r._id) },
    });

    const latestResumes = await Resume.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const latestJobDescriptions = await JobDescription.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const latestSuggestions = await Suggestion.find({
      resumeId: { $in: latestResumes.map((r) => r._id) },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      totalResumes,
      totalJobDescriptions,
      totalSuggestions,
      latestResumes,
      latestJobDescriptions,
      latestSuggestions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

module.exports = { getDashboard };
