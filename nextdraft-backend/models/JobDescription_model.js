const mongoose = require("mongoose");

const jobDescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  parsedText: {
    type: String,
    default: "",
  },
  roleTitle: {
    type: String,
    default: "",
  },
  companyName: {
    type: String,
    default: "",
  },
  keywords: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("JobDescription", jobDescriptionSchema);
