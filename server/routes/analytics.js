const express     = require("express");
const mongoose    = require("mongoose");
const Transaction = require("../models/Transaction");
const Goal        = require("../models/Goal");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

function toOid(id) {
  return mongoose.Types.ObjectId.createFromHexString(id);
}

// GET /analytics/user
router.get("/user", async (req, res) => {
  try {
    const oid = toOid(req.userId);

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const eightWeeksAgo = new Date(); eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const sixMonthsAgo  = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [daily, weekly, monthly, byCategory, goals] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: oid, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { userId: oid, createdAt: { $gte: eightWeeksAgo } } },
        { $group: { _id: { $isoWeek: "$createdAt" }, year: { $first: { $isoWeekYear: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { year: 1, _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { userId: oid, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { userId: oid } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Goal.find({ userId: req.userId }),
    ]);

    // Financial health score (0-100)
    const totalSpent   = byCategory.reduce((s, c) => s + Math.abs(c.total), 0);
    const totalSaved   = goals.reduce((s, g) => s + g.saved, 0);
    const completedGoals = goals.filter((g) => g.status === "completed").length;
    const activeGoals    = goals.filter((g) => g.status !== "completed").length;
    const hasWarnings    = goals.some((g) => g.warningStatus !== "none");

    let healthScore = 60;
    if (totalSaved > 0)       healthScore += 10;
    if (completedGoals > 0)   healthScore += 10;
    if (!hasWarnings)         healthScore += 10;
    if (activeGoals > 0)      healthScore += 5;
    if (totalSpent === 0)     healthScore += 5;
    healthScore = Math.min(healthScore, 100);

    res.json({
      daily:      daily.map((x) => ({ date: x._id, amount: Math.abs(x.total), count: x.count })),
      weekly:     weekly.map((x) => ({ week: `W${x._id}`, amount: Math.abs(x.total) })),
      monthly:    monthly.map((x) => ({ month: x._id, amount: Math.abs(x.total) })),
      byCategory: byCategory.map((x) => ({ name: x._id, value: Math.abs(x.total), count: x.count })),
      goals:      goals.map((g) => ({
        title:      g.title,
        category:   g.category,
        target:     g.target,
        saved:      g.saved,
        pct:        g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0,
        status:     g.status,
        monthlyMin: g.monthlyMin,
        targetDate: g.targetDate,
      })),
      healthScore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
