const express = require("express");
const { protect } = require("../middleware/auth");
const { createFeedback, myFeedback } = require("../controllers/feedback_controller");

const router = express.Router();

router.post("/", protect, createFeedback);
router.get("/me", protect, myFeedback);

module.exports = router;
