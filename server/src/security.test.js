import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { articleInput, settingsInput, validatePasswordStrength, parseArticle } from "./lib/validation.js";
import { requireAdmin, requireSameOrigin } from "./middleware/auth.js";
import { publicFilter } from "./routes/articles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("Security Test 1: Unauthenticated requests to admin routes are strictly denied", async () => {
  let statusSet = null;
  let jsonResponse = null;

  const mockReq = {
    cookies: {},
    get: () => null,
    ip: "127.0.0.1",
    originalUrl: "/api/admin/articles",
    method: "GET"
  };

  const mockRes = {
    status(code) {
      statusSet = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  await requireAdmin(mockReq, mockRes, () => {
    assert.fail("Should not call next() for unauthenticated requests");
  });

  assert.equal(statusSet, 401, "Admin access without token must return 401 Unauthorized");
  assert.match(jsonResponse.error, /Authentication required|Admin privileges only/);
});

test("Security Test 2: CSRF protection rejects mismatched origins on state-changing requests", () => {
  process.env.CLIENT_URL = "http://localhost:5173";
  let statusSet = null;

  const mockReq = {
    get(header) {
      if (header === "origin") return "http://malicious-attacker.com";
      return null;
    },
    ip: "127.0.0.1",
    originalUrl: "/api/admin/articles"
  };

  const mockRes = {
    status(code) {
      statusSet = code;
      return this;
    },
    json() {
      return this;
    }
  };

  requireSameOrigin(mockReq, mockRes, () => {
    assert.fail("Should not call next() for origin mismatch");
  });

  assert.equal(statusSet, 403, "Origin mismatch must be rejected with 403 Forbidden");
});

test("Security Test 3: Public filter guarantees draft, archived, and future scheduled stories are NEVER public", () => {
  const filter = publicFilter();
  assert.ok(filter.$or, "Public filter must contain an $or clause");

  // Every branch must require publishAt <= now
  for (const branch of filter.$or) {
    assert.ok(
      branch.status === "published" || branch.status === "scheduled",
      "Status must strictly be published or scheduled"
    );
    assert.ok(branch.publishAt, "Must include a publishAt time boundary");
    assert.ok(branch.publishAt.$lte instanceof Date, "Must enforce publishAt <= new Date()");
  }

  // Ensure draft is never a status in public filter
  const hasDraft = filter.$or.some((b) => b.status === "draft");
  assert.equal(hasDraft, false, "Drafts must NEVER be included in public queries");

  // Ensure archived is never in public filter
  const hasArchived = filter.$or.some((b) => b.status === "archived");
  assert.equal(hasArchived, false, "Archived stories must NEVER be included in public queries");
});

test("Security Test 4: Password complexity validator rejects weak or short admin passwords", () => {
  assert.equal(validatePasswordStrength("123456").valid, false);
  assert.equal(validatePasswordStrength("password123").valid, false); // No uppercase
  assert.equal(validatePasswordStrength("PASSWORD123").valid, false); // No lowercase
  assert.equal(validatePasswordStrength("PasswordOnly").valid, false); // No number

  const strong = validatePasswordStrength("SecureNewsroom2026!#");
  assert.equal(strong.valid, true, "Strong password meeting all criteria must pass");
});

test("Security Test 5: Malicious article input, bad slugs, and protocol smuggling are rejected", () => {
  const base = {
    title: "A valid headline of sufficient length",
    slug: "valid-headline-slug",
    summary: "This is a sufficiently long summary that passes all validation checks easily.",
    body: "## Valid Body\n\nThis is a valid body with more than twenty characters of text.",
    author: "Test Author",
    category: "507f1f77bcf86cd799439011",
    status: "draft",
    publishAt: "2026-10-30T12:00:00.000Z"
  };

  // Reject malicious slug with directory traversal
  assert.throws(() => parseArticle({ ...base, slug: "../../../etc/passwd" }), /slug/);

  // Reject javascript: protocol in image URL
  assert.throws(() => parseArticle({ ...base, imageUrl: "javascript:alert(1)" }), /imageUrl/);

  // Reject insecure http: in image URL
  assert.throws(() => parseArticle({ ...base, imageUrl: "http://example.com/pic.jpg" }), /imageUrl/);

  // Reject invalid MongoDB category ObjectId
  assert.throws(() => parseArticle({ ...base, category: "invalid-not-hex-id" }), /category/);
});

test("Security Test 6: Settings schema strictly validates Google AdSense Publisher IDs and slot IDs", () => {
  // Valid settings
  const valid = settingsInput.safeParse({
    siteName: "The Meridian Record",
    adsenseClientId: "ca-pub-1234567890123456",
    adsenseHeaderSlot: "1234567890",
    adsEnabled: true
  });
  assert.ok(valid.success, "Valid AdSense IDs should pass");

  // Invalid publisher ID format (must start with ca-pub-)
  const invalidClient = settingsInput.safeParse({
    adsenseClientId: "invalid-client-id"
  });
  assert.equal(invalidClient.success, false, "Invalid AdSense ID must be rejected");

  // Non-numeric slot ID
  const invalidSlot = settingsInput.safeParse({
    adsenseHeaderSlot: "non-numeric-slot-abc"
  });
  assert.equal(invalidSlot.success, false, "Non-numeric slot ID must be rejected");
});

test("Security Test 7: Production secrets are not committed or exposed in client bundles", () => {
  const clientSrcPath = path.resolve(__dirname, "../../client/src");
  const clientFiles = fs.readdirSync(clientSrcPath, { recursive: true });

  const forbiddenSecrets = ["JWT_SECRET", "MONGODB_URI", "CLOUDINARY_API_SECRET", "ADMIN_PASSWORD"];

  for (const file of clientFiles) {
    const fullPath = path.join(clientSrcPath, file);
    if (!fs.statSync(fullPath).isFile()) continue;
    if (fullPath.endsWith(".js") || fullPath.endsWith(".jsx") || fullPath.endsWith(".html")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const secret of forbiddenSecrets) {
        assert.ok(
          !content.includes(`process.env.${secret}`),
          `Client file ${file} must not reference private secret ${secret}`
        );
      }
    }
  }
});
