const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 6 },
    role:          { type: String, enum: ["admin", "member"], default: "member" },
    familyId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    linkedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Profile & personalization
    avatar:      { type: String, default: "" },
    theme:       { type: String, default: "default" },
    accentColor: { type: String, default: "#8B5CF6" },

    // Blocking system
    isBlocked:   { type: Boolean, default: false },
    blockReason: { type: String,  default: "" },
    blockedAt:   { type: Date,    default: null },
    blockedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
