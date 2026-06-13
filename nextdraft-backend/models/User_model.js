const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ledgerEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["credit", "debit"], required: true },
    points: { type: Number, required: true, min: 0 },
    rupees: { type: Number, default: 0, min: 0 },
    reason: { type: String, default: "", maxlength: 200 },
    paymentId: { type: String, default: "" },
    adminAction: { type: Boolean, default: false },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please add a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 8,
      select: false,
    },
    profileImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    pointsBalance: {
      type: Number,
      default: 50,
      min: 0,
    },
    pointsLedger: [ledgerEntrySchema],
    plan: {
      type: String,
      enum: ["freemium", "pro", "expert"],
      default: "freemium",
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
      index: true,
    },
    bannedAt: { type: Date, default: null },
    bannedReason: { type: String, default: "" },
    lastLoginAt: { type: Date, default: null },
    resetPasswordToken: { type: String, default: "", select: false },
    resetPasswordExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    profileImage: this.profileImage,
    pointsBalance: this.pointsBalance ?? 0,
    pointsLedger: this.pointsLedger ?? [],
    plan: this.plan,
    planExpiresAt: this.planExpiresAt,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
