const User = require("../models/User_model");
const Resume = require("../models/Resume_model");
const JobDescription = require("../models/JobDescription_model");
const Suggestion = require("../models/Suggestion_model");
const Transaction = require("../models/Transaction_model");
const Feedback = require("../models/Feedback_model");
const { stripAndTrim } = require("../middleware/validate");

/* ============= STATS ============= */
const getStats = async (req, res) => {
  try {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      bannedUsers,
      newUsers30,
      newUsers7,
      totalResumes,
      totalJDs,
      totalOptimizations,
      paidTransactions,
      openFeedback,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "banned" }),
      User.countDocuments({ createdAt: { $gte: since30 } }),
      User.countDocuments({ createdAt: { $gte: since7 } }),
      Resume.countDocuments(),
      JobDescription.countDocuments(),
      Suggestion.countDocuments(),
      Transaction.countDocuments({ status: "paid" }),
      Feedback.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    ]);

    const revenueAgg = await Transaction.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$rupees" }, count: { $sum: 1 } } },
    ]);
    const revenue30Agg = await Transaction.aggregate([
      { $match: { status: "paid", createdAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: "$rupees" } } },
    ]);

    return res.json({
      users: { total: totalUsers, banned: bannedUsers, newLast30: newUsers30, newLast7: newUsers7 },
      content: { resumes: totalResumes, jds: totalJDs, optimizations: totalOptimizations },
      revenue: {
        totalRupees: revenueAgg[0]?.total ?? 0,
        totalTransactions: paidTransactions,
        last30DaysRupees: revenue30Agg[0]?.total ?? 0,
      },
      support: { openFeedback },
    });
  } catch (error) {
    console.error("[Admin] stats error:", error.message);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
};

/* ============= REPORTS (charts & breakdowns) ============= */
const getReports = async (req, res) => {
  try {
    const days = Math.min(180, Math.max(7, parseInt(req.query.days, 10) || 30));
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // -- Helper to fill missing days in a series with zeros
    const fillSeries = (rows, valueKeys) => {
      const map = new Map(rows.map((r) => [r._id, r]));
      const out = [];
      for (let i = days - 1; i >= 0; i -= 1) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().slice(0, 10);
        const row = map.get(key);
        const entry = { date: key };
        valueKeys.forEach((k) => {
          entry[k] = row && row[k] != null ? row[k] : 0;
        });
        out.push(entry);
      }
      return out;
    };

    const dailyDateExpr = {
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
    };

    const [
      userGrowthRows,
      revenueRows,
      optimizationRows,
      packBreakdown,
      statusBreakdown,
      topSpendersRaw,
      summary,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: dailyDateExpr, signups: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { status: "paid", createdAt: { $gte: since } } },
        {
          $group: {
            _id: dailyDateExpr,
            revenue: { $sum: "$rupees" },
            transactions: { $sum: 1 },
          },
        },
      ]),
      Suggestion.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: dailyDateExpr,
            runs: { $sum: 1 },
            applied: { $sum: { $ifNull: ["$appliedCount", 0] } },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: "$pack",
            count: { $sum: 1 },
            rupees: { $sum: "$rupees" },
            points: { $sum: "$points" },
          },
        },
        { $sort: { rupees: -1 } },
      ]),
      Transaction.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: "$userId",
            spent: { $sum: "$rupees" },
            transactions: { $sum: 1 },
            points: { $sum: "$points" },
          },
        },
        { $sort: { spent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      ]),
      // Period summary metrics
      Promise.all([
        User.countDocuments({ createdAt: { $gte: since } }),
        Transaction.aggregate([
          { $match: { status: "paid", createdAt: { $gte: since } } },
          { $group: { _id: null, sum: { $sum: "$rupees" }, count: { $sum: 1 } } },
        ]),
        Suggestion.countDocuments({ createdAt: { $gte: since } }),
        Transaction.countDocuments({ createdAt: { $gte: since } }),
      ]),
    ]);

    const [periodSignups, periodRevenueAgg, periodOptimizations, periodTotalTx] = summary;
    const periodRevenue = periodRevenueAgg[0]?.sum ?? 0;
    const periodPaidTx = periodRevenueAgg[0]?.count ?? 0;
    const conversion =
      periodTotalTx > 0 ? Math.round((periodPaidTx / periodTotalTx) * 1000) / 10 : 0;

    return res.json({
      days,
      since: since.toISOString(),
      now: now.toISOString(),
      summary: {
        newUsers: periodSignups,
        revenue: periodRevenue,
        paidTransactions: periodPaidTx,
        totalTransactions: periodTotalTx,
        optimizations: periodOptimizations,
        conversionPct: conversion,
      },
      userGrowth: fillSeries(userGrowthRows, ["signups"]),
      revenue: fillSeries(revenueRows, ["revenue", "transactions"]),
      optimizations: fillSeries(optimizationRows, ["runs", "applied"]),
      packBreakdown: packBreakdown.map((p) => ({
        pack: p._id,
        count: p.count,
        rupees: p.rupees,
        points: p.points,
      })),
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s._id,
        count: s.count,
      })),
      topSpenders: topSpendersRaw.map((t) => ({
        userId: t._id,
        name: t.user?.name || "(deleted user)",
        email: t.user?.email || "—",
        spent: t.spent,
        transactions: t.transactions,
        points: t.points,
      })),
    });
  } catch (error) {
    console.error("[Admin] reports error:", error.message);
    return res.status(500).json({ message: "Failed to fetch reports" });
  }
};

/* ============= USERS ============= */
const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    const search = stripAndTrim(req.query.search, 200);
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { email: { $regex: escaped, $options: "i" } },
        { name: { $regex: escaped, $options: "i" } },
      ];
    }
    if (req.query.status === "active" || req.query.status === "banned") {
      query.status = req.query.status;
    }
    if (req.query.role === "admin" || req.query.role === "user") {
      query.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-pointsLedger")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(query),
    ]);

    return res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Admin] listUsers error:", error.message);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [resumes, jds, optimizationCount, transactions] = await Promise.all([
      Resume.find({ userId: user._id }).select("fileName version isEdited createdAt").lean(),
      JobDescription.find({ userId: user._id }).select("roleTitle companyName createdAt").lean(),
      Suggestion.countDocuments({
        resumeId: { $in: (await Resume.find({ userId: user._id }).select("_id").lean()).map((r) => r._id) },
      }),
      Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return res.json({ user, resumes, jds, optimizationCount, transactions });
  } catch (error) {
    console.error("[Admin] getUserDetail error:", error.message);
    return res.status(500).json({ message: "Failed to fetch user detail" });
  }
};

/* ============= MANUAL POINT ADJUSTMENT ============= */
const adjustPoints = async (req, res) => {
  try {
    const { type, points, reason } = req.body;
    const amount = parseInt(points, 10);

    if (!type || !["credit", "debit"].includes(type)) {
      return res.status(400).json({ message: "type must be 'credit' or 'debit'" });
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return res.status(400).json({ message: "points must be between 1 and 100000" });
    }
    const reasonText = stripAndTrim(reason, 200) || `Admin ${type}`;

    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (type === "debit" && (user.pointsBalance || 0) < amount) {
      return res.status(400).json({
        message: `User only has ${user.pointsBalance} points. Cannot debit ${amount}.`,
      });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { pointsBalance: type === "credit" ? amount : -amount },
        $push: {
          pointsLedger: {
            type,
            points: amount,
            rupees: 0,
            reason: reasonText,
            adminAction: true,
            actorId: req.user._id,
          },
        },
      },
      { new: true }
    );

    return res.json({
      message: `${amount} points ${type === "credit" ? "added to" : "removed from"} user`,
      user: updated.toPublic(),
    });
  } catch (error) {
    console.error("[Admin] adjustPoints error:", error.message);
    return res.status(500).json({ message: "Failed to adjust points" });
  }
};

/* ============= SET ROLE (promote / demote admin) ============= */
const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "role must be 'user' or 'admin'" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    if (user.role === role) {
      return res.status(400).json({ message: `User is already ${role}` });
    }

    // Don't allow demoting the last admin
    if (role === "user" && user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot demote the last admin. Promote another user to admin first.",
        });
      }
    }

    // Don't promote banned users
    if (role === "admin" && user.status === "banned") {
      return res.status(400).json({
        message: "Cannot promote a banned user. Reactivate them first.",
      });
    }

    user.role = role;
    await user.save();

    return res.json({
      message:
        role === "admin"
          ? `${user.email} promoted to admin`
          : `${user.email} demoted to user`,
      user: user.toPublic(),
    });
  } catch (error) {
    console.error("[Admin] setUserRole error:", error.message);
    return res.status(500).json({ message: "Failed to update user role" });
  }
};

/* ============= BAN / UNBAN ============= */
const setUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!["active", "banned"].includes(status)) {
      return res.status(400).json({ message: "status must be 'active' or 'banned'" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot ban an admin account" });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own status" });
    }

    user.status = status;
    if (status === "banned") {
      user.bannedAt = new Date();
      user.bannedReason = stripAndTrim(reason, 200);
    } else {
      user.bannedAt = null;
      user.bannedReason = "";
    }
    await user.save();

    return res.json({
      message: `User ${status === "banned" ? "banned" : "reactivated"}`,
      user: user.toPublic(),
    });
  } catch (error) {
    console.error("[Admin] setUserStatus error:", error.message);
    return res.status(500).json({ message: "Failed to update user status" });
  }
};

/* ============= TRANSACTIONS ============= */
const listTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const query = {};
    if (["created", "paid", "failed", "refunded"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return res.json({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Admin] listTransactions error:", error.message);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

/* ============= FEEDBACK ============= */
const listFeedback = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const query = {};
    if (["open", "in_progress", "resolved", "closed"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      Feedback.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(query),
    ]);

    return res.json({
      feedback: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Admin] listFeedback error:", error.message);
    return res.status(500).json({ message: "Failed to fetch feedback" });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const allowedStatus = ["open", "in_progress", "resolved", "closed"];
    const update = {};
    if (allowedStatus.includes(req.body.status)) update.status = req.body.status;
    if (typeof req.body.adminNotes === "string") {
      update.adminNotes = req.body.adminNotes.slice(0, 4000);
    }
    if (req.body.status === "resolved" || req.body.status === "closed") {
      update.resolvedAt = new Date();
    }

    const item = await Feedback.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: "Feedback not found" });
    return res.json(item);
  } catch (error) {
    console.error("[Admin] updateFeedback error:", error.message);
    return res.status(500).json({ message: "Failed to update feedback" });
  }
};

module.exports = {
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
};
