const express     = require("express");
const User        = require("../models/User");
const Transaction = require("../models/Transaction");
const Goal        = require("../models/Goal");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// ── helpers ───────────────────────────────────────────────
function deriveStatus(saved, target) {
  if (saved >= target) return "completed";
  if (saved > 0)       return "on-track";
  return "pending";
}

// ── MEMBERS ───────────────────────────────────────────────

router.get("/members", adminOnly, async (req, res) => {
  try {
    const members = await User.find({ linkedAdminId: req.userId }).select("-password");
    res.json(members);
  } catch {
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

router.post("/invite", adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    const member = await User.create({ name, email, password, role: "member", familyId: req.userId, linkedAdminId: req.userId });
    res.status(201).json({ message: "Member added", member: { id: member._id, _id: member._id, name: member.name, email: member.email, isBlocked: false } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

router.delete("/members/:id", adminOnly, async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, linkedAdminId: req.userId });
    if (!member) return res.status(404).json({ error: "Member not found" });
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: "Member removed" });
  } catch {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// ── BLOCK / UNBLOCK ───────────────────────────────────────

// POST /family/members/:id/block
router.post("/members/:id/block", adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ error: "Block reason is required" });

    const member = await User.findOne({ _id: req.params.id, linkedAdminId: req.userId });
    if (!member) return res.status(404).json({ error: "Member not found" });
    if (member.isBlocked) return res.status(400).json({ error: "Member is already blocked" });

    member.isBlocked   = true;
    member.blockReason = reason.trim();
    member.blockedAt   = new Date();
    member.blockedBy   = req.userId;
    await member.save();

    res.json({ message: "Member blocked", member: { _id: member._id, name: member.name, isBlocked: true, blockReason: member.blockReason, blockedAt: member.blockedAt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to block member" });
  }
});

// POST /family/members/:id/unblock
router.post("/members/:id/unblock", adminOnly, async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, linkedAdminId: req.userId });
    if (!member) return res.status(404).json({ error: "Member not found" });

    member.isBlocked   = false;
    member.blockReason = "";
    member.blockedAt   = null;
    member.blockedBy   = null;
    await member.save();

    res.json({ message: "Member unblocked", member: { _id: member._id, name: member.name, isBlocked: false } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unblock member" });
  }
});

// ── EXPENSES ──────────────────────────────────────────────

router.get("/expenses", adminOnly, async (req, res) => {
  try {
    const members   = await User.find({ linkedAdminId: req.userId }).select("_id name");
    const memberIds = members.map((m) => m._id);
    const allIds    = [req.userId, ...memberIds];

    const transactions = await Transaction.find({ userId: { $in: allIds } }).sort({ createdAt: -1 }).lean();

    const nameMap = {};
    members.forEach((m) => (nameMap[m._id.toString()] = m.name));
    const adminUser = await User.findById(req.userId).select("name");
    nameMap[req.userId.toString()] = adminUser?.name || "Admin";

    res.json(transactions.map((t) => ({ ...t, userName: nameMap[t.userId.toString()] || "Unknown" })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch family expenses" });
  }
});

// ── GOALS ─────────────────────────────────────────────────

// GET /family/goals — all family goals
router.get("/goals", adminOnly, async (req, res) => {
  try {
    const members   = await User.find({ linkedAdminId: req.userId }).select("_id name");
    const memberIds = members.map((m) => m._id);
    const allIds    = [req.userId, ...memberIds];

    const goals = await Goal.find({ userId: { $in: allIds } }).lean();

    const nameMap = {};
    members.forEach((m) => (nameMap[m._id.toString()] = m.name));
    const adminUser = await User.findById(req.userId).select("name");
    nameMap[req.userId.toString()] = adminUser?.name || "Admin";

    res.json(goals.map((g) => ({ ...g, userName: nameMap[g.userId.toString()] || "Unknown" })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch family goals" });
  }
});

// POST /family/goals/assign — admin assigns a goal to a member
router.post("/goals/assign", adminOnly, async (req, res) => {
  try {
    const { memberId, title, description, category, target, months } = req.body;
    if (!memberId || !title || !target) return res.status(400).json({ error: "memberId, title and target are required" });

    // Verify member belongs to this admin
    const member = await User.findOne({ _id: memberId, linkedAdminId: req.userId });
    if (!member) return res.status(404).json({ error: "Member not found" });

    // Max 5 active goals for member
    const activeCount = await Goal.countDocuments({ userId: memberId, status: { $ne: "completed" } });
    if (activeCount >= 5) return res.status(400).json({ error: "Member already has 5 active goals" });

    const targetNum  = Number(target);
    const monthsNum  = Math.max(Number(months) || 12, 1);
    const monthly    = Math.max(Math.ceil(targetNum / monthsNum), 1000);
    const startDate  = new Date();
    const targetDate = new Date(startDate);
    targetDate.setMonth(targetDate.getMonth() + monthsNum);

    const goal = await Goal.create({
      userId:          memberId,
      title,
      description:     description || "",
      category:        category || "Personal",
      target:          targetNum,
      saved:           0,
      remainingAmount: targetNum,
      months:          monthsNum,
      monthlyMin:      monthly,
      startDate,
      targetDate,
      autoSaveEnabled: true,
      status:          "pending",
      warningStatus:   "none",
      assignedByAdmin: req.userId,
      assignedMember:  memberId,
      isAdminAssigned: true,
    });

    res.status(201).json({ message: "Goal assigned", data: goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign goal" });
  }
});

// PUT /family/goals/:id — admin edits a member's goal
router.put("/goals/:id", adminOnly, async (req, res) => {
  try {
    const { title, description, category, target, months, saved } = req.body;

    // Find goal that belongs to a member of this admin
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const member = await User.findOne({ _id: goal.userId, linkedAdminId: req.userId });
    if (!member) return res.status(403).json({ error: "Not authorized to edit this goal" });

    const newTarget  = target !== undefined ? Number(target)              : goal.target;
    const newMonths  = months !== undefined ? Math.max(Number(months), 1) : goal.months;
    const newSaved   = saved  !== undefined ? Number(saved)               : goal.saved;
    const newMonthly = Math.max(Math.ceil(newTarget / newMonths), 1000);
    const newTargetDate = new Date(goal.startDate);
    newTargetDate.setMonth(newTargetDate.getMonth() + newMonths);
    const newStatus = deriveStatus(newSaved, newTarget);

    const updated = await Goal.findByIdAndUpdate(
      req.params.id,
      {
        title:           title       !== undefined ? title       : goal.title,
        description:     description !== undefined ? description : goal.description,
        category:        category    !== undefined ? category    : goal.category,
        target:          newTarget,
        saved:           newSaved,
        remainingAmount: Math.max(newTarget - newSaved, 0),
        months:          newMonths,
        monthlyMin:      newMonthly,
        targetDate:      newTargetDate,
        status:          newStatus,
      },
      { returnDocument: "after" }
    );

    res.json({ message: "Goal updated", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// ── ANALYTICS ─────────────────────────────────────────────

router.get("/analytics", adminOnly, async (req, res) => {
  try {
    const members   = await User.find({ linkedAdminId: req.userId }).select("_id name");
    const memberIds = members.map((m) => m._id);
    const allIds    = [req.userId, ...memberIds];

    const nameMap = {};
    members.forEach((m) => (nameMap[m._id.toString()] = m.name));
    const adminUser = await User.findById(req.userId).select("name");
    nameMap[req.userId.toString()] = adminUser?.name || "Admin";

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixMonthsAgo  = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [byCategory, byUser, daily, monthly, goalsByCategory] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: { $in: allIds } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { userId: { $in: allIds } } },
        { $group: { _id: "$userId", total: { $sum: "$amount" } } },
      ]),
      // Daily with category breakdown
      Transaction.aggregate([
        { $match: { userId: { $in: allIds }, createdAt: { $gte: thirtyDaysAgo } } },
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
        { $match: { userId: { $in: allIds }, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
      Goal.aggregate([
        { $match: { userId: { $in: allIds } } },
        { $group: { _id: "$category", totalTarget: { $sum: "$target" }, totalSaved: { $sum: "$saved" }, count: { $sum: 1 } } },
      ]),
    ]);

    // Reshape daily into { date, total, categories: [{name, amount, count}] }
    const dailyMap = {};
    daily.forEach(({ _id, total, count }) => {
      const { date, category } = _id;
      if (!dailyMap[date]) dailyMap[date] = { date, total: 0, categories: [] };
      dailyMap[date].total += Math.abs(total);
      dailyMap[date].categories.push({ name: category, amount: Math.abs(total), count });
    });
    const dailyFormatted = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      byCategory:      byCategory.map((x) => ({ name: x._id, value: Math.abs(x.total) })),
      byUser:          byUser.map((x) => ({ name: nameMap[x._id.toString()] || "Unknown", value: Math.abs(x.total) })),
      daily:           dailyFormatted,
      monthly:         monthly.map((x) => ({ month: x._id, amount: Math.abs(x.total) })),
      goalsByCategory: goalsByCategory.map((x) => ({ category: x._id, target: x.totalTarget, saved: x.totalSaved, count: x.count })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
