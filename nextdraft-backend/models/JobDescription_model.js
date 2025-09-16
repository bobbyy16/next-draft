// models/JobDescription_model.js
const mongoose = require("mongoose");

const jobDescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  parsedText: {
    type: String,
    required: true,
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
