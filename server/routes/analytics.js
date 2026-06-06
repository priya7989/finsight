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

// ── Health score algorithm ────────────────────────────────
// Returns 0-100 score + status label + breakdown
function computeHealthScore({ income, totalExpenses, monthlyGoalSavings, goals, monthlyData }) {
  let score = 100;
  const checks = [];

  // 1. Income vs expense ratio (weight: 30)
  const expenseRatio = income > 0 ? totalExpenses / income : 1;
  if (expenseRatio >= 1) {
    score -= 30;
    checks.push({ label: "Expenses exceed income", ok: false, impact: "critical" });
  } else if (expenseRatio >= 0.9) {
    score -= 22;
    checks.push({ label: "Expenses >90% of income", ok: false, impact: "high" });
  } else if (expenseRatio >= 0.75) {
    score -= 12;
    checks.push({ label: "Expenses >75% of income", ok: false, impact: "medium" });
  } else if (expenseRatio >= 0.5) {
    score -= 5;
    checks.push({ label: "Expenses <75% of income", ok: true, impact: "low" });
  } else {
    checks.push({ label: "Healthy expense ratio (<50%)", ok: true, impact: "none" });
  }

  // 2. Remaining balance after goals (weight: 20)
  const balance = income - totalExpenses - monthlyGoalSavings;
  if (balance < 0) {
    score -= 20;
    checks.push({ label: "Negative balance after goals", ok: false, impact: "critical" });
  } else if (income > 0 && balance < income * 0.1) {
    score -= 10;
    checks.push({ label: "Balance <10% of income", ok: false, impact: "high" });
  } else {
    checks.push({ label: "Positive usable balance", ok: true, impact: "none" });
  }

  // 3. Goal health (weight: 20)
  const activeGoals    = goals.filter((g) => g.status !== "completed");
  const warningGoals   = goals.filter((g) => g.warningStatus && g.warningStatus !== "none");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const pausedGoals    = goals.filter((g) => g.status === "paused");

  if (warningGoals.length > 0) {
    score -= warningGoals.length * 5;
    checks.push({ label: `${warningGoals.length} goal(s) with financial warnings`, ok: false, impact: "medium" });
  }
  if (pausedGoals.length > 0) {
    score -= pausedGoals.length * 3;
    checks.push({ label: `${pausedGoals.length} goal(s) paused`, ok: false, impact: "low" });
  }
  if (completedGoals.length > 0) {
    score += Math.min(completedGoals.length * 3, 10);
    checks.push({ label: `${completedGoals.length} goal(s) completed`, ok: true, impact: "none" });
  }
  if (activeGoals.length > 0 && warningGoals.length === 0) {
    checks.push({ label: `${activeGoals.length} active goal(s) on track`, ok: true, impact: "none" });
  }

  // 4. Savings consistency (weight: 15) — check if monthly spending is consistent
  if (monthlyData.length >= 2) {
    const amounts = monthlyData.map((m) => m.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0; // coefficient of variation
    if (cv > 0.5) {
      score -= 10;
      checks.push({ label: "Inconsistent monthly spending", ok: false, impact: "medium" });
    } else {
      checks.push({ label: "Consistent spending pattern", ok: true, impact: "none" });
    }
  }

  // 5. Goal savings rate (weight: 15)
  const savingsRate = income > 0 ? monthlyGoalSavings / income : 0;
  if (savingsRate === 0 && income > 0) {
    score -= 10;
    checks.push({ label: "No active savings goals", ok: false, impact: "medium" });
  } else if (savingsRate >= 0.2) {
    checks.push({ label: "Saving ≥20% of income", ok: true, impact: "none" });
  } else if (savingsRate >= 0.1) {
    checks.push({ label: "Saving 10-20% of income", ok: true, impact: "none" });
  } else if (savingsRate > 0) {
    score -= 3;
    checks.push({ label: "Saving <10% of income", ok: false, impact: "low" });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status, statusColor;
  if (score >= 80)      { status = "Excellent"; statusColor = "#10B981"; }
  else if (score >= 65) { status = "Stable";    statusColor = "#8B5CF6"; }
  else if (score >= 45) { status = "Risky";     statusColor = "#F59E0B"; }
  else                  { status = "Critical";  statusColor = "#EF4444"; }

  return { score, status, statusColor, checks, expenseRatio, savingsRate, balance };
}

// GET /analytics/user
router.get("/user", async (req, res) => {
  try {
    const oid    = toOid(req.userId);
    const income = Number(req.query.income) || 0;

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const eightWeeksAgo = new Date(); eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const sixMonthsAgo  = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [daily, weekly, monthly, byCategory, goals, allTransactions] = await Promise.all([
      // Daily with category breakdown
      Transaction.aggregate([
        { $match: { userId: oid, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              date:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              category: "$category",
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
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
      Transaction.find({ userId: req.userId }),
    ]);

    // Reshape daily: group by date, collect categories
    const dailyMap = {};
    daily.forEach(({ _id, total, count }) => {
      const { date, category } = _id;
      if (!dailyMap[date]) dailyMap[date] = { date, amount: 0, count: 0, categories: [] };
      dailyMap[date].amount += Math.abs(total);
      dailyMap[date].count  += count;
      dailyMap[date].categories.push({ name: category, amount: Math.abs(total), count });
    });
    const dailyFormatted = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const totalExpenses      = allTransactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const monthlyGoalSavings = goals
      .filter((g) => g.status !== "completed" && g.autoSaveEnabled !== false)
      .reduce((s, g) => s + (g.monthlyMin || 0), 0);

    const monthlyData = monthly.map((x) => ({ month: x._id, amount: Math.abs(x.total) }));

    const health = computeHealthScore({
      income,
      totalExpenses,
      monthlyGoalSavings,
      goals,
      monthlyData,
    });

    // Expense vs savings monthly comparison
    const expenseVsSavings = monthlyData.map((m) => ({
      month:   m.month,
      expense: m.amount,
      savings: income > 0 ? Math.max(income - m.amount - monthlyGoalSavings, 0) : 0,
      goals:   monthlyGoalSavings,
    }));

    // Financial flow
    const financialFlow = {
      income,
      expenses:    totalExpenses,
      goalSavings: monthlyGoalSavings,
      balance:     income - totalExpenses - monthlyGoalSavings,
    };

    res.json({
      daily:      dailyFormatted,
      weekly:     weekly.map((x) => ({ week: `W${x._id}`, amount: Math.abs(x.total) })),
      monthly:    monthlyData,
      byCategory: byCategory.map((x) => ({ name: x._id, value: Math.abs(x.total), count: x.count })),
      goals:      goals.map((g) => ({
        _id:        g._id,
        title:      g.title,
        category:   g.category,
        target:     g.target,
        saved:      g.saved,
        remaining:  Math.max(g.target - g.saved, 0),
        pct:        g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0,
        status:     g.status,
        monthlyMin: g.monthlyMin,
        months:     g.months,
        targetDate: g.targetDate,
        startDate:  g.startDate,
        warningStatus: g.warningStatus,
      })),
      health,
      expenseVsSavings,
      financialFlow,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
