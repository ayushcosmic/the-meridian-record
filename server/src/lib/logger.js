/**
 * Security and Audit Logger
 * Strictly excludes passwords, authentication cookies, tokens, and sensitive credentials.
 */

export function logSecurityEvent(eventType, details = {}) {
  const timestamp = new Date().toISOString();
  const safeDetails = { ...details };

  // Explicitly sanitize sensitive keys
  const sensitiveKeys = ["password", "token", "admin_session", "secret", "cookie", "authorization"];
  for (const key of Object.keys(safeDetails)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      safeDetails[key] = "[REDACTED]";
    }
  }

  const logEntry = {
    timestamp,
    type: eventType,
    ...safeDetails
  };

  // Structured JSON output for audit log inspection
  console.log(`[SECURITY_AUDIT] ${JSON.stringify(logEntry)}`);
}
