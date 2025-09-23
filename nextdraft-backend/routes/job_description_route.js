// routes/jobDescription_routes.js
const express = require("express");
const { protect } = require("../middleware/auth");
const {
  uploadJobDescription,
  getAllJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
} = require("../controllers/job_description_controller");

const router = express.Router();

router.post("/upload", protect, uploadJobDescription);
router.get("/", protect, getAllJobDescriptions);
router.get("/:id", protect, getJobDescriptionById);
router.delete("/:id", protect, deleteJobDescription);

module.exports = router;
