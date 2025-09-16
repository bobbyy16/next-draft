const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobDescription",
    required: true,
  },
  suggestions: [
    {
      type: {
        type: String,
        required: true,
      },
      originalText: String,
      suggestedText: String,
      explanation: String,
      priority: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "medium",
      },
      applied: {
        type: Boolean,
        default: false,
      },
    },
  ],
  overallScore: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Suggestion", suggestionSchema);
