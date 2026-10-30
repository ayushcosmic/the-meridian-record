import { Router } from "express";
import Setting from "../models/Setting.js";
import { settingsInput } from "../lib/validation.js";
import { requireAdmin, requireSameOrigin } from "../middleware/auth.js";
import { logSecurityEvent } from "../lib/logger.js";

const router = Router();

const defaultSettings = {
  siteName: "The Meridian Record",
  tagline: "Independent News & Clear-Eyed Global Analysis",
  breakingBannerActive: false,
  breakingBannerText: "",
  breakingBannerUrl: "",
  adsEnabled: true,
  adsenseClientId: process.env.ADSENSE_CLIENT_ID || "",
  adsenseHeaderSlot: process.env.ADSENSE_HEADER_SLOT || "",
  adsenseSidebarSlot: process.env.ADSENSE_SIDEBAR_SLOT || "",
  adsenseInArticleSlot: process.env.ADSENSE_INARTICLE_SLOT || "",
  sponsoredDisclaimer: "This article contains sponsored editorial content compliant with Meridian publication guidelines."
};

export async function getMergedSettings() {
  const docs = await Setting.find().lean();
  const map = {};
  for (const doc of docs) {
    map[doc.key] = doc.value;
  }
  return { ...defaultSettings, ...map };
}

// Public settings endpoint
router.get("/public", async (req, res) => {
  const settings = await getMergedSettings();
  res.json({ settings });
});

// Admin-only settings endpoint
router.get("/admin", requireAdmin, async (req, res) => {
  const settings = await getMergedSettings();
  res.json({ settings });
});

router.put("/admin", requireAdmin, requireSameOrigin, async (req, res) => {
  const parsed = settingsInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
    });
  }

  const updates = parsed.data;
  const promises = Object.entries(updates).map(([key, value]) =>
    Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true, setDefaultsOnInsert: true })
  );
  await Promise.all(promises);

  logSecurityEvent("SETTINGS_UPDATED", { admin: req.admin.email, ip: req.ip, keys: Object.keys(updates) });
  const updatedSettings = await getMergedSettings();
  res.json({ settings: updatedSettings });
});

export default router;
