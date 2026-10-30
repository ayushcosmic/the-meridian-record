import "../config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db.js";
import User from "../models/User.js";
import { validatePasswordStrength } from "../lib/validation.js";

try {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.JWT_SECRET || "";

  if (!email || !password) {
    throw new Error("Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before seeding the administrator.");
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    throw new Error(`Admin password does not meet security requirements: ${strength.message}`);
  }

  if (!secret || secret.length < 32 || secret.startsWith("replace-")) {
    throw new Error("JWT_SECRET must be set to a secure, unpredictable secret of at least 32 characters in .env.");
  }

  await connectDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Administrator account for ${email} already exists (refusing to overwrite). To reset password, use the admin dashboard or database administrative console.`);
  } else {
    await User.create({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
      failedLoginAttempts: 0
    });
    console.log(`Administrator account created successfully: ${email}`);
  }
} catch (error) {
  console.error("Admin seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
