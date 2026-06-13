const express = require("express");
const { protect } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const {
  uploadJobDescription,
  getAllJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
  updateJobDescription,
} = require("../controllers/job_description_controller");

const router = express.Router();

router.post("/upload", protect, uploadJobDescription);
router.get("/", protect, getAllJobDescriptions);
router.get("/:id", protect, validateObjectId("id"), getJobDescriptionById);
router.patch("/:id", protect, validateObjectId("id"), updateJobDescription);
router.delete("/:id", protect, validateObjectId("id"), deleteJobDescription);

module.exports = router;
