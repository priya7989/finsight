require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");

const Transaction = require("./models/Transaction");
const Goal        = require("./models/Goal");
const { authMiddleware } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(console.error);

// ── Route modules ─────────────────────────────────────────
app.use("/auth",      require("./routes/auth"));
app.use("/family",    require("./routes/family"));
app.use("/analytics", require("./routes/analytics"));

// ── Helpers ───────────────────────────────────────────────
function deriveStatus(saved, target) {
  if (saved >= target)  return "completed";
  if (saved > 0)        return "on-track";
  return "pending";
}

function deriveWarning(saved, target, income, totalExpenses, totalMonthlyGoals) {
  if (!income) return "none";
  const balance = income - totalExpenses - totalMonthlyGoals;
  if (balance < 0)                          return "over-budget";
  if (balance < totalMonthlyGoals * 0.5)    return "low-balance";
  if (totalExpenses > income * 0.8)         return "risky";
  return "none";
}

// ── TRANSACTIONS ──────────────────────────────────────────

app.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const list = await Transaction.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/transactions", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, source } = req.body;
    const t = await Transaction.create({ title, amount, category, source, userId: req.userId });
    res.status(201).json({ message: "Transaction Saved", data: t });
  } catch {
    res.status(500).json({ error: "Failed to save transaction" });
  }
});

app.put("/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category } = req.body;
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, amount: Number(amount), category },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ error: "Transaction not found" });
    res.json({ message: "Transaction Updated", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update Failed" });
  }
});

app.delete("/transactions/:id", authMiddleware, async (req, res) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Transaction Deleted" });
  } catch {
    res.status(500).json({ error: "Delete Failed" });
  }
});

// ── GOALS ─────────────────────────────────────────────────

app.get("/goals", authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// POST /goals — create with smart validation
app.post("/goals", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, target, saved, months, income } = req.body;
    if (!title || !target) return res.status(400).json({ error: "title and target are required" });

    // Max 5 active goals
    const activeCount = await Goal.countDocuments({ userId: req.userId, status: { $ne: "completed" } });
    if (activeCount >= 5) {
      return res.status(400).json({ error: "Maximum 5 active goals allowed. Complete or delete an existing goal first." });
    }

    const targetNum  = Number(target);
    const savedNum   = Number(saved) || 0;
    const monthsNum  = Math.max(Number(months) || 12, 1);
    const monthly    = Math.max(Math.ceil(targetNum / monthsNum), 1000); // min ₹1000/month

    const startDate  = new Date();
    const targetDate = new Date(startDate);
    targetDate.setMonth(targetDate.getMonth() + monthsNum);

    // Financial validation
    let warningStatus = "none";
    if (income) {
      const transactions = await Transaction.find({ userId: req.userId });
      const totalExpenses = transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      const existingGoals = await Goal.find({ userId: req.userId, status: { $ne: "completed" } });
      const existingMonthly = existingGoals.reduce((s, g) => s + (g.monthlyMin || 0), 0);
      warningStatus = deriveWarning(savedNum, targetNum, Number(income), totalExpenses, existingMonthly + monthly);
    }

    const status = deriveStatus(savedNum, targetNum);

    const goal = await Goal.create({
      userId: req.userId,
      title,
      description: description || "",
      category:    category || "Personal",
      target:      targetNum,
      saved:       savedNum,
      remainingAmount: Math.max(targetNum - savedNum, 0),
      months:      monthsNum,
      monthlyMin:  monthly,
      startDate,
      targetDate,
      autoSaveEnabled: true,
      status,
      warningStatus,
    });

    res.status(201).json({ message: "Goal Saved", data: goal, warning: warningStatus !== "none" ? warningStatus : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save goal" });
  }
});

// PUT /goals/:id — update with recalculation
app.put("/goals/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, target, saved, months, monthlyMin, autoSaveEnabled, income } = req.body;

    const existing = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) return res.status(404).json({ error: "Goal not found" });

    const newTarget  = target  !== undefined ? Number(target)  : existing.target;
    const newSaved   = saved   !== undefined ? Number(saved)   : existing.saved;
    const newMonths  = months  !== undefined ? Math.max(Number(months), 1) : existing.months;

    // Recalculate monthly if target or months changed
    let newMonthly = monthlyMin !== undefined ? Number(monthlyMin) : existing.monthlyMin;
    if (target !== undefined || months !== undefined) {
      newMonthly = Math.max(Math.ceil(newTarget / newMonths), 1000);
    }

    const newTargetDate = new Date(existing.startDate);
    newTargetDate.setMonth(newTargetDate.getMonth() + newMonths);

    let warningStatus = "none";
    if (income) {
      const transactions = await Transaction.find({ userId: req.userId });
      const totalExpenses = transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      const otherGoals = await Goal.find({ userId: req.userId, _id: { $ne: req.params.id }, status: { $ne: "completed" } });
      const otherMonthly = otherGoals.reduce((s, g) => s + (g.monthlyMin || 0), 0);
      warningStatus = deriveWarning(newSaved, newTarget, Number(income), totalExpenses, otherMonthly + newMonthly);
    }

    const newStatus = autoSaveEnabled === false ? "paused" : deriveStatus(newSaved, newTarget);

    const updated = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        title:           title       !== undefined ? title       : existing.title,
        description:     description !== undefined ? description : existing.description,
        category:        category    !== undefined ? category    : existing.category,
        target:          newTarget,
        saved:           newSaved,
        remainingAmount: Math.max(newTarget - newSaved, 0),
        months:          newMonths,
        monthlyMin:      newMonthly,
        targetDate:      newTargetDate,
        autoSaveEnabled: autoSaveEnabled !== undefined ? autoSaveEnabled : existing.autoSaveEnabled,
        status:          newStatus,
        warningStatus,
      },
      { returnDocument: "after" }
    );

    res.json({ message: "Goal Updated", data: updated, warning: warningStatus !== "none" ? warningStatus : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update Failed" });
  }
});

// POST /goals/:id/contribute — add monthly contribution
app.post("/goals/:id/contribute", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (goal.status === "completed") return res.status(400).json({ error: "Goal already completed" });

    const contribution = Number(amount) || goal.monthlyMin;
    const newSaved = Math.min(goal.saved + contribution, goal.target);
    const newStatus = deriveStatus(newSaved, goal.target);

    const updated = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        saved: newSaved,
        remainingAmount: Math.max(goal.target - newSaved, 0),
        status: newStatus,
        lastAutoSave: new Date(),
      },
      { returnDocument: "after" }
    );

    res.json({ message: "Contribution added", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Contribution failed" });
  }
});

app.delete("/goals/:id", authMiddleware, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Goal Deleted" });
  } catch {
    res.status(500).json({ error: "Delete Failed" });
  }
});

// ── Home ──────────────────────────────────────────────────
app.get("/", (_req, res) => res.send("FinSight Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
