const express = require("express");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function safeUser(u) {
  return {
    id:            u._id,
    name:          u.name,
    email:         u.email,
    role:          u.role,
    familyId:      u.familyId,
    linkedAdminId: u.linkedAdminId,
    avatar:        u.avatar || "",
    theme:         u.theme  || "default",
    accentColor:   u.accentColor || "#8B5CF6",
    isBlocked:     u.isBlocked   || false,
    blockReason:   u.blockReason || "",
  };
}

// ── REGISTER ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    const assignedRole = role === "admin" ? "admin" : "member";
    const user = await User.create({ name, email, password, role: assignedRole });
    res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── LOGIN ─────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Block check — stop JWT generation for blocked users
    if (user.isBlocked) {
      return res.status(403).json({
        error: "blocked",
        message: `Your account has been blocked. Reason: ${user.blockReason || "Policy violation"}`,
        blockReason: user.blockReason || "Policy violation",
        blockedAt: user.blockedAt,
      });
    }
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── ME ────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: safeUser(user) });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── UPDATE PROFILE (name, email, avatar, theme, accentColor) ──
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, avatar, theme, accentColor } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Email uniqueness check if changing
    if (email && email !== user.email) {
      const exists = await User.findOne({ email, _id: { $ne: req.userId } });
      if (exists) return res.status(409).json({ error: "Email already in use" });
      user.email = email.toLowerCase().trim();
    }

    if (name)        user.name        = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (theme)       user.theme       = theme;
    if (accentColor) user.accentColor = accentColor;

    await user.save();
    res.json({ message: "Profile updated", user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ── CHANGE PASSWORD ───────────────────────────────────────
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both fields required" });
    if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Password change failed" });
  }
});

module.exports = router;
