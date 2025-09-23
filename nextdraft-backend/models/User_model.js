const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
  },
  industry: {
    type: String,
    enum: [
      "Software",
      "Finance",
      "Healthcare",
      "Education",
      "Marketing",
      "Sales",
      "Other",
    ],
    default: "Other",
  },
  experienceLevel: {
    type: String,
    enum: ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager"],
    default: "Intern",
  },
  profileImage: {
    url: { type: String, default: "" },
    public_id: { type: String, default: "" },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
