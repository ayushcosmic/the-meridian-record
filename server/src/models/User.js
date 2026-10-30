import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin"], default: "admin" },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date }
}, { timestamps: true });

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export default mongoose.model("User", userSchema);
