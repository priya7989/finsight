const express     = require("express");
const User        = require("../models/User");
const Transaction = require("../models/Transaction");
const Goal        = require("../models/Goal");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// GET /family/members
router.get("/members", adminOnly, async (req, res) => {
  try {
    const members = await User.find({ linkedAdminId: req.userId }).select("-password");
    res.json(members);
  } catch {
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// POST /family/invite
router.post("/invite", adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    const member = await User.create({ name, email, password, role: "member", familyId: req.userId, linkedAdminId: req.userId });
    res.status(201).json({ message: "Member added", member: { id: member._id, _id: member._id, name: member.name, email: member.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// DELETE /family/members/:id
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

// GET /family/expenses
router.get("/expenses", adminOnly, async (req, res) => {
  try {
    const members = await User.find({ linkedAdminId: req.userId }).select("_id name");
    const memberIds = members.map((m) => m._id);
    const allIds = [req.userId, ...memberIds];

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

// GET /family/goals — admin sees all family goals
router.get("/goals", adminOnly, async (req, res) => {
  try {
    const members = await User.find({ linkedAdminId: req.userId }).select("_id name");
    const memberIds = members.map((m) => m._id);
    const allIds = [req.userId, ...memberIds];

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

// GET /family/analytics
router.get("/analytics", adminOnly, async (req, res) => {
  try {
    const members = await User.find({ linkedAdminId: req.userId }).select("_id name");
    const memberIds = members.map((m) => m._id);
    const allIds = [req.userId, ...memberIds];

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
      Transaction.aggregate([
        { $match: { userId: { $in: allIds }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
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

    res.json({
      byCategory:      byCategory.map((x) => ({ name: x._id, value: Math.abs(x.total) })),
      byUser:          byUser.map((x) => ({ name: nameMap[x._id.toString()] || "Unknown", value: Math.abs(x.total) })),
      daily:           daily.map((x) => ({ date: x._id, amount: Math.abs(x.total) })),
      monthly:         monthly.map((x) => ({ month: x._id, amount: Math.abs(x.total) })),
      goalsByCategory: goalsByCategory.map((x) => ({ category: x._id, target: x.totalTarget, saved: x.totalSaved, count: x.count })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
