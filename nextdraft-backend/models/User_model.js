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
  profileImage: {
    url: { type: String, default: "" },
    public_id: { type: String, default: "" },
  },
  pointsBalance: {
    type: Number,
    default: 50,
  },
  pointsLedger: [
    {
      type: {
        type: String,
        enum: ["credit", "debit"],
        required: true,
      },
      points: {
        type: Number,
        required: true,
      },
      rupees: {
        type: Number,
        default: 0,
      },
      reason: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  plan: {
    type: String,
    enum: ["freemium", "pro", "expert"],
    default: "freemium",
  },
  planExpiresAt: {
    type: Date,
    default: null,
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
