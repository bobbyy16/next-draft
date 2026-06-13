const Resume = require("../models/Resume_model");
const JobDescription = require("../models/JobDescription_model");
const Suggestion = require("../models/Suggestion_model");

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [latestResumes, totalJobDescriptions, totalResumes] = await Promise.all([
      Resume.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      JobDescription.countDocuments({ userId }),
      Resume.countDocuments({ userId }),
    ]);

    const allResumeIds = await Resume.find({ userId }).select("_id").lean();
    const resumeIds = allResumeIds.map((r) => r._id);

    const [totalSuggestions, latestJobDescriptions, latestSuggestions] = await Promise.all([
      Suggestion.countDocuments({ resumeId: { $in: resumeIds } }),
      JobDescription.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Suggestion.find({ resumeId: { $in: latestResumes.map((r) => r._id) } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.status(200).json({
      totalResumes,
      totalJobDescriptions,
      totalSuggestions,
      latestResumes,
      latestJobDescriptions,
      latestSuggestions,
    });
  } catch (error) {
    console.error("[Dashboard] error:", error.message);
    return res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

module.exports = { getDashboard };
