const crypto = require("crypto");
const Transaction = require("../models/Transaction_model");
const User = require("../models/User_model");
const { getRazorpay, isConfigured } = require("../config/razorpay");
const { sendPointsAddedEmail } = require("../services/email_service");

const PACKS = {
  starter: { points: 50, rupees: 50, label: "Starter — 50 points" },
  plus: { points: 150, rupees: 150, label: "Plus — 150 points" },
  pro: { points: 500, rupees: 500, label: "Pro — 500 points" },
};

/* ============= GET PACKS ============= */
const getPacks = (req, res) => {
  return res.json({
    enabled: isConfigured(),
    keyId: process.env.RAZORPAY_KEY_ID || "",
    packs: Object.entries(PACKS).map(([id, pack]) => ({ id, ...pack })),
  });
};

/* ============= CREATE ORDER ============= */
const createOrder = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({ message: "Payments are not configured yet. Try again soon." });
    }
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ message: "Payment provider unavailable." });
    }

    const { pack } = req.body;
    const selected = PACKS[pack];
    if (!selected) {
      return res.status(400).json({ message: "Invalid pack" });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      pack,
      points: selected.points,
      rupees: selected.rupees,
      currency: "INR",
      status: "created",
      provider: "razorpay",
    });

    const order = await razorpay.orders.create({
      amount: selected.rupees * 100,
      currency: "INR",
      receipt: String(transaction._id),
      notes: {
        userId: String(req.user._id),
        pack,
        points: String(selected.points),
      },
    });

    transaction.razorpayOrderId = order.id;
    await transaction.save();

    return res.status(201).json({
      transactionId: transaction._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      pack: { id: pack, ...selected },
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("[Payment] create order error:", error.message);
    return res.status(500).json({ message: "Could not create payment order" });
  }
};

/* ============= VERIFY PAYMENT ============= */
const verifyPayment = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({ message: "Payments are not configured." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const signatureMatches = (() => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(expected, "hex"),
          Buffer.from(razorpay_signature, "hex")
        );
      } catch {
        return false;
      }
    })();

    const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
    if (!transaction) return res.status(404).json({ message: "Order not found" });
    if (String(transaction.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized for this order" });
    }

    if (!signatureMatches) {
      transaction.status = "failed";
      transaction.failureReason = "Invalid signature";
      transaction.razorpayPaymentId = razorpay_payment_id;
      await transaction.save();
      return res.status(400).json({ message: "Payment verification failed" });
    }

    if (transaction.status === "paid") {
      // Idempotent — already credited
      const user = await User.findById(req.user._id);
      return res.status(200).json({
        message: "Payment already processed",
        pointsBalance: user?.pointsBalance ?? 0,
        transaction,
      });
    }

    // Atomic credit
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { pointsBalance: transaction.points },
        $push: {
          pointsLedger: {
            type: "credit",
            points: transaction.points,
            rupees: transaction.rupees,
            reason: `Pack purchase: ${transaction.pack}`,
            paymentId: razorpay_payment_id,
          },
        },
      },
      { new: true }
    );

    transaction.status = "paid";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.creditedAt = new Date();
    await transaction.save();

    sendPointsAddedEmail(updatedUser, transaction.points).catch((e) =>
      console.error("[Email] PointsAdded:", e.message)
    );

    return res.status(200).json({
      message: "Payment verified and points credited",
      pointsBalance: updatedUser.pointsBalance,
      transaction,
    });
  } catch (error) {
    console.error("[Payment] verify error:", error.message);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

/* ============= LIST MY TRANSACTIONS ============= */
const listMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json(transactions);
  } catch (error) {
    console.error("[Payment] list error:", error.message);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

module.exports = {
  PACKS,
  getPacks,
  createOrder,
  verifyPayment,
  listMyTransactions,
};
