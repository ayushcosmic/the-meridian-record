import { z } from "zod";

const secureHttpsPattern = (val) => {
  if (!val) return true;
  try {
    const url = new URL(val);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export const articleInput = z.object({
  title: z.string().trim().min(5).max(180),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(20).max(360),
  body: z.string().trim().min(20).max(100000),
  author: z.string().trim().min(2).max(100),
  authorRole: z.string().trim().max(100).default("Staff Correspondent"),
  category: z.string().regex(/^[a-f\d]{24}$/i),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  imageUrl: z.union([
    z.literal(""),
    z.string().max(2048).refine(secureHttpsPattern, "Image URL must use HTTPS protocol.")
  ]).default(""),
  imageAlt: z.string().trim().max(240).default(""),
  imageCredit: z.string().trim().max(240).default(""),
  status: z.enum(["draft", "scheduled", "published", "archived"]),
  publishAt: z.string().datetime({ offset: true }),
  isBreaking: z.boolean().default(false),
  breakingPriority: z.number().int().min(0).max(100).default(0),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isOpinion: z.boolean().default(false),
  isSponsored: z.boolean().default(false),
  readingTime: z.number().int().min(1).max(120).default(3),
  metaTitle: z.string().trim().max(120).default(""),
  metaDescription: z.string().trim().max(240).default(""),
  canonicalUrl: z.union([
    z.literal(""),
    z.string().max(2048).refine(secureHttpsPattern, "Canonical URL must use HTTPS protocol.")
  ]).default(""),
  focusKeywords: z.array(z.string().trim().min(1).max(50)).max(15).default([]),
  corrections: z.array(z.object({
    date: z.union([z.string().datetime({ offset: true }), z.date()]).optional(),
    text: z.string().trim().min(5).max(1000)
  })).default([])
});

export const settingsInput = z.object({
  siteName: z.string().trim().min(2).max(100).default("The Meridian Record"),
  tagline: z.string().trim().max(200).default("Independent News & Clear-Eyed Global Analysis"),
  breakingBannerActive: z.boolean().default(false),
  breakingBannerText: z.string().trim().max(300).default(""),
  breakingBannerUrl: z.string().trim().max(500).default(""),
  adsEnabled: z.boolean().default(true),
  adsenseClientId: z.string().trim().regex(/^(ca-pub-\d+)?$/, "AdSense Publisher ID must be in format ca-pub-XXXXXXXXXXXXXXXX").default(""),
  adsenseHeaderSlot: z.string().trim().regex(/^(\d+)?$/, "Slot ID must be numeric").default(""),
  adsenseSidebarSlot: z.string().trim().regex(/^(\d+)?$/, "Slot ID must be numeric").default(""),
  adsenseInArticleSlot: z.string().trim().regex(/^(\d+)?$/, "Slot ID must be numeric").default(""),
  sponsoredDisclaimer: z.string().trim().max(500).default("This article contains sponsored editorial content compliant with Meridian publication guidelines.")
});

export function parseArticle(input) {
  const result = articleInput.safeParse(input);
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" "));
    error.status = 400;
    throw error;
  }
  return {
    ...result.data,
    publishAt: new Date(result.data.publishAt),
    corrections: result.data.corrections.map((c) => ({
      ...c,
      date: c.date ? new Date(c.date) : new Date()
    }))
  };
}

export function escapeRegex(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function validatePasswordStrength(password) {
  if (typeof password !== "string" || password.length < 12) {
    return { valid: false, message: "Password must be at least 12 characters long." };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasNumber) {
    return { valid: false, message: "Password must contain uppercase letters, lowercase letters, and at least one number." };
  }
  return { valid: true };
}
