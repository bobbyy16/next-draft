const mongoose = require("mongoose");

const dashboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resumesUploaded: {
    type: Number,
    default: 0,
  },
  jobDescriptionsUploaded: {
    type: Number,
    default: 0,
  },
  suggestionsApplied: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Dashboard", dashboardSchema);
