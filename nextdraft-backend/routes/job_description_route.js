// routes/jobDescription_routes.js
const express = require("express");
const { protect } = require("../middleware/auth");
const {
  uploadJobDescription,
  getAllJobDescriptions,
  getJobDescriptionById,
} = require("../controllers/job_description_controller");

const router = express.Router();

router.post("/upload", protect, uploadJobDescription);
router.get("/", protect, getAllJobDescriptions);
router.get("/:id", protect, getJobDescriptionById);

module.exports = router;
