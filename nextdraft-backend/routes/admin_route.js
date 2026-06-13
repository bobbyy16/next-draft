const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const {
  getStats,
  getReports,
  listUsers,
  getUserDetail,
  adjustPoints,
  setUserRole,
  setUserStatus,
  listTransactions,
  listFeedback,
  updateFeedback,
} = require("../controllers/admin_controller");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/reports", getReports);
router.get("/users", listUsers);
router.get("/users/:id", validateObjectId("id"), getUserDetail);
router.post("/users/:id/points", validateObjectId("id"), adjustPoints);
router.post("/users/:id/role", validateObjectId("id"), setUserRole);
router.post("/users/:id/status", validateObjectId("id"), setUserStatus);
router.get("/transactions", listTransactions);
router.get("/feedback", listFeedback);
router.patch("/feedback/:id", validateObjectId("id"), updateFeedback);

module.exports = router;
