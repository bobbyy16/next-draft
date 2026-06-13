const Feedback = require("../models/Feedback_model");
const { stripAndTrim } = require("../middleware/validate");

const VALID_TYPES = ["bug", "feature", "support", "other"];

const createFeedback = async (req, res) => {
  try {
    const type = VALID_TYPES.includes(req.body.type) ? req.body.type : "support";
    const subject = stripAndTrim(req.body.subject, 200);
    const message = stripAndTrim(req.body.message, 4000);

    if (!subject || subject.length < 3) {
      return res.status(400).json({ message: "Subject is required (min 3 characters)" });
    }
    if (!message || message.length < 10) {
      return res.status(400).json({ message: "Message is required (min 10 characters)" });
    }

    const item = await Feedback.create({
      userId: req.user._id,
      type,
      subject,
      message,
    });
    return res.status(201).json({ message: "Thanks — we received your message", feedback: item });
  } catch (error) {
    console.error("[Feedback] create error:", error.message);
    return res.status(500).json({ message: "Could not submit feedback" });
  }
};

const myFeedback = async (req, res) => {
  try {
    const items = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json(items);
  } catch (error) {
    console.error("[Feedback] list error:", error.message);
    return res.status(500).json({ message: "Could not load your feedback" });
  }
};

module.exports = { createFeedback, myFeedback };
