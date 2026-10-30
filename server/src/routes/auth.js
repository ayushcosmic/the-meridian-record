import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import User from "../models/User.js";
import { requireAdmin, requireSameOrigin } from "../middleware/auth.js";
import { validatePasswordStrength } from "../lib/validation.js";
import { logSecurityEvent } from "../lib/logger.js";

const router = Router();
const loginLimit = {
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts from this network. Please wait 15 minutes." }
};

router.post("/login", requireSameOrigin, async (req, res) => {
  const parsed = z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(200)
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid email address and password." });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await User.findOne({ email });

  if (user && user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    logSecurityEvent("LOGIN_LOCKED_ACCOUNT_ATTEMPT", { email, ip: req.ip });
    return res.status(429).json({
      error: `Account is temporarily locked due to repeated failed logins. Please try again in ${minutesLeft} minute(s).`
    });
  }

  const valid = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));

  if (!valid) {
    if (user) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        logSecurityEvent("ACCOUNT_LOCKED_BRUTE_FORCE", { email, ip: req.ip, attempts: user.failedLoginAttempts });
      }
      await user.save();
    }
    logSecurityEvent("LOGIN_FAILURE", { email, ip: req.ip });
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  // Login successful: reset lockout counters
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const secret = process.env.JWT_SECRET;
  const tokenId = crypto.randomBytes(16).toString("hex");
  const token = jwt.sign({ sub: user.id, jti: tokenId }, secret, {
    expiresIn: "8h",
    issuer: "meridian-record"
  });

  const isSecure = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";
  const sameSite = process.env.COOKIE_SAMESITE || (isSecure ? "none" : "lax");
  res.cookie("admin_session", token, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: 8 * 60 * 60 * 1000,
    path: "/"
  });

  logSecurityEvent("LOGIN_SUCCESS", { email: user.email, ip: req.ip, role: user.role });
  res.json({ user: { email: user.email, role: user.role, lastLoginAt: user.lastLoginAt } });
});

router.post("/logout", requireSameOrigin, (req, res) => {
  const isSecure = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";
  const sameSite = process.env.COOKIE_SAMESITE || (isSecure ? "none" : "lax");
  res.clearCookie("admin_session", {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    path: "/"
  });
  logSecurityEvent("LOGOUT", { ip: req.ip });
  res.json({ ok: true });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ user: { email: req.admin.email, role: req.admin.role, lastLoginAt: req.admin.lastLoginAt } });
});

router.post("/change-password", requireAdmin, requireSameOrigin, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12).max(200)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Provide current password and a new password with at least 12 characters." });
  }

  const user = await User.findById(req.admin._id);
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    logSecurityEvent("PASSWORD_CHANGE_INVALID_CURRENT", { email: user.email, ip: req.ip });
    return res.status(400).json({ error: "Current password does not match." });
  }

  const strength = validatePasswordStrength(parsed.data.newPassword);
  if (!strength.valid) {
    return res.status(400).json({ error: strength.message });
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await user.save();

  logSecurityEvent("PASSWORD_CHANGED_SUCCESS", { email: user.email, ip: req.ip });
  res.json({ message: "Password updated successfully." });
});

export { loginLimit };
export default router;
