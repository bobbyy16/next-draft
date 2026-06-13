const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const uploadDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const random = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${random}${safeExt}`);
  },
});

const ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF and DOCX documents allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

module.exports = upload;
