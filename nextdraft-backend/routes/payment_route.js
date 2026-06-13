const express = require("express");
const { protect } = require("../middleware/auth");
const { paymentLimiter } = require("../middleware/rate_limit");
const {
  getPacks,
  createOrder,
  verifyPayment,
  listMyTransactions,
} = require("../controllers/payment_controller");

const router = express.Router();

router.get("/packs", getPacks);
router.get("/me", protect, listMyTransactions);
router.post("/create-order", protect, paymentLimiter, createOrder);
router.post("/verify", protect, paymentLimiter, verifyPayment);

module.exports = router;
