const User = require("../models/User_model");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail, sendPointsAddedEmail, sendAccountDeletedEmail } = require("../services/email_service");

const publicUser = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage,
  pointsBalance: user.pointsBalance ?? 0,
  pointsLedger: user.pointsLedger ?? [],
  plan: user.plan,
  planExpiresAt: user.planExpiresAt,
  ...(token ? { token } : {}),
});

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    let profileImage = { url: "", public_id: "" };
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pics",
      });
      profileImage = { url: result.secure_url, public_id: result.public_id };
      fs.unlinkSync(req.file.path);
    }

    const user = await User.create({
      name,
      email,
      password,
      profileImage,
      pointsBalance: 50,
      pointsLedger: [{ type: "credit", points: 50, rupees: 0, reason: "Free starter points" }],
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Fire-and-forget welcome email
    sendWelcomeEmail(user);

    res.status(201).json(publicUser(user, token));
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.pointsBalance === undefined || user.pointsBalance === null) {
      user.pointsBalance = 50;
      user.pointsLedger.push({
        type: "credit",
        points: 50,
        rupees: 0,
        reason: "Free starter points",
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json(publicUser(user, token));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUser = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || req.body.name.trim().length === 0) {
        return res.status(400).json({ message: "Name must be a non-empty string" });
      }
      user.name = req.body.name.trim();
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
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
        });
        user.profileImage = { url: result.secure_url, public_id: result.public_id };
        fs.unlinkSync(req.file.path);
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    user.updatedAt = new Date();
    const updatedUser = await user.save();
    res.json(publicUser(updatedUser));
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addPoints = async (req, res) => {
  try {
    const { pack } = req.body;
    const packs = {
      starter: { points: 50, rupees: 50 },
      plus: { points: 150, rupees: 150 },
      pro: { points: 500, rupees: 500 },
    };
    const selected = packs[pack] || packs.starter;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.pointsBalance = (user.pointsBalance || 0) + selected.points;
    user.pointsLedger.push({
      type: "credit",
      points: selected.points,
      rupees: selected.rupees,
      reason: `${selected.points} point pack`,
    });
    await user.save();

    // Fire-and-forget points email
    sendPointsAddedEmail(user, selected.points);

    res.json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add points" });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profileImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
      }
    }

    // Save email/name before deleting
    const { email, name } = user;

    await User.findByIdAndDelete(req.params.id);

    // Fire-and-forget goodbye email
    sendAccountDeletedEmail(email, name);

    res.json({ message: "User removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await User.countDocuments();

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  addPoints,
  deleteUser,
  getAllUsers,
};
