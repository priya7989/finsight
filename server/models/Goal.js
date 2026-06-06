const mongoose = require("mongoose");

const GOAL_CATEGORIES = [
  "Education", "Child Future", "Emergency", "Home",
  "Vehicle", "Retirement", "Medical", "Personal",
];

const contributionSchema = new mongoose.Schema({
  amount:    { type: Number, required: true },
  date:      { type: Date,   default: Date.now },
  note:      { type: String, default: "" },
}, { _id: false });

const goalSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category:    { type: String, enum: GOAL_CATEGORIES, default: "Personal" },

    target:          { type: Number, required: true },
    saved:           { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },

    months:          { type: Number, default: 12 },
    monthlyMin:      { type: Number, default: 0 },
    startDate:       { type: Date,   default: Date.now },
    targetDate:      { type: Date },

    autoSaveEnabled: { type: Boolean, default: true },
    lastAutoSave:    { type: Date },

    status:        { type: String, enum: ["pending", "on-track", "completed", "paused"], default: "pending" },
    warningStatus: { type: String, enum: ["none", "low-balance", "over-budget", "risky"], default: "none" },

    // Family goal assignment
    assignedByAdmin:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedMember:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isAdminAssigned:  { type: Boolean, default: false },

    // Contribution history
    contributionHistory: [contributionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);
module.exports.GOAL_CATEGORIES = GOAL_CATEGORIES;
