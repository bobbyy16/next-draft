const User = require("../models/User_model");
const Resume = require("../models/Resume_model");
const JobDescription = require("../models/JobDescription_model");
const Suggestion = require("../models/Suggestion_model");
const Transaction = require("../models/Transaction_model");
const Feedback = require("../models/Feedback_model");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  isValidEmail,
  isStrongPassword,
  stripAndTrim,
} = require("../middleware/validate");
const {
  sendWelcomeEmail,
  sendAccountDeletedEmail,
  sendPasswordResetEmail,
} = require("../services/email_service");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const buildAuthResponse = (user, token) => ({
  ...user.toPublic(),
  ...(token ? { token } : {}),
});

const resetBaseUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("[Upload] cleanup failed:", err.message);
  }
};

/* ============= REGISTER ============= */
const registerUser = async (req, res) => {
  const name = stripAndTrim(req.body.name, 80);
  const email = stripAndTrim(req.body.email, 254).toLowerCase();
  const password = req.body.password;

  try {
    if (!name || name.length < 2) {
      safeUnlink(req.file?.path);
      return res.status(400).json({ message: "Name is required (min 2 characters)" });
    }
    if (!isValidEmail(email)) {
      safeUnlink(req.file?.path);
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (!isStrongPassword(password)) {
      safeUnlink(req.file?.path);
      return res.status(400).json({
        message: "Password must be 8+ chars with an uppercase letter, a number, and a symbol",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      safeUnlink(req.file?.path);
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    let profileImage = { url: "", public_id: "" };
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pics",
        resource_type: "image",
      });
      profileImage = { url: result.secure_url, public_id: result.public_id };
      safeUnlink(req.file.path);
    }

    const user = await User.create({
      name,
      email,
      password,
      profileImage,
      pointsBalance: 50,
      pointsLedger: [
        { type: "credit", points: 50, rupees: 0, reason: "Free starter points" },
      ],
      lastLoginAt: new Date(),
    });

    const token = signToken(user._id);
    sendWelcomeEmail(user).catch((e) => console.error("[Email] Welcome:", e.message));
    return res.status(201).json(buildAuthResponse(user, token));
  } catch (error) {
    safeUnlink(req.file?.path);
    console.error("[Register] error:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    return res.status(500).json({ message: "Could not create account. Please try again." });
  }
};

/* ============= LOGIN ============= */
const loginUser = async (req, res) => {
  const email = stripAndTrim(req.body.email, 254).toLowerCase();
  const password = req.body.password;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.status === "banned") {
      return res.status(403).json({
        message: "Account suspended. Contact support if you believe this is a mistake.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user._id);
    return res.json(buildAuthResponse(user, token));
  } catch (error) {
    console.error("[Login] error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============= ME ============= */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("[Me] error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============= FORGOT PASSWORD ============= */
const forgotPassword = async (req, res) => {
  const email = stripAndTrim(req.body.email, 254).toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required" });

  const responseBody = {
    message: "If that email exists, a reset link has been sent.",
  };

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(responseBody);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${resetBaseUrl()}/auth/reset-password?token=${rawToken}`;
    sendPasswordResetEmail(user, resetUrl).catch((error) =>
      console.error("[Email] Reset:", error.message)
    );

    // Only leak the URL in non-production AND when SMTP is not configured (dev only)
    if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) {
      return res.status(200).json({ ...responseBody, resetUrl });
    }
    return res.status(200).json(responseBody);
  } catch (error) {
    console.error("[ForgotPassword] error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============= RESET PASSWORD ============= */
const resetPassword = async (req, res) => {
  const token = stripAndTrim(req.body.token, 200);
  const password = req.body.password;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must be 8+ chars with uppercase, number, and symbol",
    });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpiresAt");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    }

    user.password = password;
    user.resetPasswordToken = "";
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("[ResetPassword] error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============= GET BY ID (self or admin) ============= */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("[GetUser] error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============= UPDATE (self or admin) ============= */
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      safeUnlink(req.file?.path);
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name !== undefined) {
      const next = stripAndTrim(req.body.name, 80);
      if (!next || next.length < 2) {
        safeUnlink(req.file?.path);
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
      user.name = next;
    }

    if (req.body.password) {
      if (!isStrongPassword(req.body.password)) {
        safeUnlink(req.file?.path);
        return res.status(400).json({
          message: "Password must be 8+ chars with uppercase, number, and symbol",
        });
      }
      user.password = req.body.password;
    }

    if (req.file) {
      try {
        if (user.profileImage?.public_id) {
          await cloudinary.uploader.destroy(user.profileImage.public_id);
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_pics",
          resource_type: "image",
        });
        user.profileImage = { url: result.secure_url, public_id: result.public_id };
        safeUnlink(req.file.path);
      } catch (cloudinaryError) {
        console.error("[Cloudinary] upload error:", cloudinaryError.message);
        safeUnlink(req.file?.path);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    await user.save();
    return res.json(buildAuthResponse(user));
  } catch (error) {
    safeUnlink(req.file?.path);
    console.error("[UpdateUser] error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============= DELETE (self or admin) — full cascade ============= */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Safety: admins cannot delete other admins or themselves through the API.
    // (If you ever need to demote-then-delete, do it in two steps.)
    const isSelfDelete = String(req.user._id) === String(user._id);
    if (req.user.role === "admin" && !isSelfDelete && user.role === "admin") {
      return res.status(400).json({
        message: "Cannot delete another admin. Demote them first.",
      });
    }
    if (isSelfDelete && req.user.role === "admin") {
      return res.status(400).json({
        message: "Admins cannot delete their own account through this endpoint.",
      });
    }

    if (user.profileImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      } catch (err) {
        console.error("[Cloudinary] profile delete:", err.message);
      }
    }

    // Cascade: delete resumes (and their Cloudinary files), JDs, suggestions, transactions, feedback
    const resumes = await Resume.find({ userId: user._id });
    await Promise.all(
      resumes.map(async (resume) => {
        if (resume.cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(resume.cloudinaryPublicId, { resource_type: "raw" });
          } catch (err) {
            console.error("[Cloudinary] resume delete:", err.message);
          }
        }
      })
    );

    const resumeIds = resumes.map((r) => r._id);

    await Promise.all([
      Resume.deleteMany({ userId: user._id }),
      JobDescription.deleteMany({ userId: user._id }),
      Suggestion.deleteMany({ resumeId: { $in: resumeIds } }),
      Transaction.deleteMany({ userId: user._id }),
      Feedback.deleteMany({ userId: user._id }),
    ]);

    const { email, name } = user;
    await User.findByIdAndDelete(user._id);

    sendAccountDeletedEmail(email, name).catch((e) =>
      console.error("[Email] AccountDeleted:", e.message)
    );

    return res.json({ message: "Account and all associated data deleted" });
  } catch (error) {
    console.error("[DeleteUser] error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  getUser,
  updateUser,
  deleteUser,
};
