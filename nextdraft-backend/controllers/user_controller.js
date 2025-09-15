const User = require("../models/User_model");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// Enum options
const INDUSTRY_OPTIONS = [
  "Software",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Other",
];

const EXPERIENCE_LEVEL_OPTIONS = [
  "Intern",
  "Junior",
  "Mid-level",
  "Senior",
  "Lead",
  "Manager",
];

// ---------------------------
// REGISTER USER
// ---------------------------
const registerUser = async (req, res) => {
  const { name, email, password, industry, experienceLevel } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate enums
    if (industry && !INDUSTRY_OPTIONS.includes(industry)) {
      return res.status(400).json({
        message: `Invalid industry. Allowed values: ${INDUSTRY_OPTIONS.join(
          ", "
        )}`,
      });
    }

    if (
      experienceLevel &&
      !EXPERIENCE_LEVEL_OPTIONS.includes(experienceLevel)
    ) {
      return res.status(400).json({
        message: `Invalid experience level. Allowed values: ${EXPERIENCE_LEVEL_OPTIONS.join(
          ", "
        )}`,
      });
    }

    // Upload profile image to Cloudinary if file exists
    let profileImage = { url: "", public_id: "" };
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pics",
      });
      profileImage = {
        url: result.secure_url,
        public_id: result.public_id,
      };
      // Clean up temporary file
      fs.unlinkSync(req.file.path);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      industry: industry || "Other",
      experienceLevel: experienceLevel || "Intern",
      profileImage,
    });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      industry: user.industry,
      experienceLevel: user.experienceLevel,
      profileImage: user.profileImage,
      token,
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------
// LOGIN USER
// ---------------------------
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        experienceLevel: user.experienceLevel,
        profileImage: user.profileImage,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------
// GET USER BY ID
// ---------------------------
const getUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------
// UPDATE USER
// ---------------------------
const updateUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Partial updates with proper validation
    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        req.body.name.trim().length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Name must be a non-empty string" });
      }
      user.name = req.body.name.trim();
    }

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = req.body.email;
    }

    if (req.body.industry) {
      if (!INDUSTRY_OPTIONS.includes(req.body.industry)) {
        return res.status(400).json({
          message: `Invalid industry. Allowed values: ${INDUSTRY_OPTIONS.join(
            ", "
          )}`,
        });
      }
      user.industry = req.body.industry;
    }

    if (req.body.experienceLevel) {
      if (!EXPERIENCE_LEVEL_OPTIONS.includes(req.body.experienceLevel)) {
        return res.status(400).json({
          message: `Invalid experience level. Allowed values: ${EXPERIENCE_LEVEL_OPTIONS.join(
            ", "
          )}`,
        });
      }
      user.experienceLevel = req.body.experienceLevel;
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters long" });
      }
      user.password = req.body.password;
    }

    // Profile image update
    if (req.file) {
      try {
        // Delete old image from Cloudinary if exists
        if (user.profileImage?.public_id) {
          await cloudinary.uploader.destroy(user.profileImage.public_id);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_pics",
        });

        user.profileImage = {
          url: result.secure_url,
          public_id: result.public_id,
        };

        // Clean up temporary file
        fs.unlinkSync(req.file.path);
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        // Clean up temporary file on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    // Update the updatedAt field
    user.updatedAt = new Date();

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      industry: updatedUser.industry,
      experienceLevel: updatedUser.experienceLevel,
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------
// DELETE USER
// ---------------------------
const deleteUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete profile image from Cloudinary if exists
    if (user.profileImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
        // Continue with user deletion even if image deletion fails
      }
    }

    // Use deleteOne instead of deprecated remove()
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------
// GET ALL USERS
// ---------------------------
const getAllUsers = async (req, res) => {
  try {
    // Add pagination support
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
  deleteUser,
  getAllUsers,
};
