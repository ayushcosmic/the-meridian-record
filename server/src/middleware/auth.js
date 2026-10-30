import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logSecurityEvent } from "../lib/logger.js";

export async function requireAdmin(req, res, next) {
  try {
    let token = req.cookies?.admin_session;
    // Allow Bearer token if header is explicitly provided (useful for secure automated integration scripts)
    const authHeader = req.get("authorization");
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      logSecurityEvent("ADMIN_AUTH_MISSING", { ip: req.ip, path: req.originalUrl, method: req.method });
      return res.status(401).json({ error: "Authentication required. Admin privileges only." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id email role failedLoginAttempts lockUntil");

    if (!user || user.role !== "admin") {
      logSecurityEvent("ADMIN_AUTH_INVALID_ROLE", { ip: req.ip, path: req.originalUrl, method: req.method });
      return res.status(401).json({ error: "Administrator session is no longer valid." });
    }

    req.admin = user;
    next();
  } catch (error) {
    logSecurityEvent("ADMIN_AUTH_EXPIRED_OR_INVALID", { ip: req.ip, path: req.originalUrl, method: req.method, error: error.name });
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Your session has expired. Sign in again." });
    }
    next(error);
  }
}

export function requireSameOrigin(req, res, next) {
  const origin = req.get("origin");
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((u) => u.trim().replace(/\/$/, ""));

  if (origin) {
    const norm = origin.replace(/\/$/, "");
    const allowed = allowedOrigins.includes(norm) || allowedOrigins.some((ao) => norm.endsWith(".vercel.app"));
    if (!allowed && process.env.NODE_ENV === "production") {
      logSecurityEvent("CSRF_ORIGIN_MISMATCH", { ip: req.ip, origin, expected: allowedOrigins, path: req.originalUrl });
      return res.status(403).json({ error: "Request origin is not allowed." });
    }
  }

  if (process.env.NODE_ENV === "production" && !origin) {
    logSecurityEvent("CSRF_MISSING_ORIGIN", { ip: req.ip, path: req.originalUrl });
    return res.status(403).json({ error: "An Origin header is required for this request." });
  }

  next();
}
