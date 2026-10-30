import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import Article from "../models/Article.js";
import Category from "../models/Category.js";
import Subscriber from "../models/Subscriber.js";
import { requireAdmin, requireSameOrigin } from "../middleware/auth.js";
import { parseArticle } from "../lib/validation.js";
import { logSecurityEvent } from "../lib/logger.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localUploadsDir = path.resolve(__dirname, "../../uploads");

// Ensure local uploads directory exists
await fs.mkdir(localUploadsDir, { recursive: true }).catch(() => {});

// File validation helper (Magic bytes check for image authenticity)
function validateImageMagicBytes(buffer, mimetype) {
  if (buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (mimetype === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimetype === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  // WEBP: RIFF ... WEBP
  if (mimetype === "image/webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  // AVIF: ....ftypavif or ftypavis
  if (mimetype === "image/avif") {
    const brand = buffer.toString("ascii", 4, 12);
    return brand.includes("ftypavif") || brand.includes("ftypavis");
  }
  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid format. Please upload a JPG, PNG, WebP, or AVIF image."));
    }
    cb(null, true);
  }
});

const categoryInput = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(240).default(""),
  order: z.number().int().default(0)
});

// Protect all admin routes
router.use(requireAdmin);
router.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return requireSameOrigin(req, res, next);
});

// Analytics and Newsroom Overview
router.get("/overview", async (req, res) => {
  const [total, drafts, published, scheduled, archived, subscribers, totalViewsAgg, mostRead] = await Promise.all([
    Article.countDocuments(),
    Article.countDocuments({ status: "draft" }),
    Article.countDocuments({ status: "published" }),
    Article.countDocuments({ status: "scheduled" }),
    Article.countDocuments({ status: "archived" }),
    Subscriber.countDocuments(),
    Article.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]),
    Article.find({ status: "published" })
      .sort({ views: -1 })
      .limit(10)
      .select("title slug views category status publishAt")
      .populate("category", "name")
      .lean()
  ]);

  const totalViews = totalViewsAgg[0]?.totalViews || 0;

  res.json({
    total,
    drafts,
    published,
    scheduled,
    archived,
    subscribers,
    totalViews,
    mostRead
  });
});

// List articles with optional status and category filters
router.get("/articles", async (req, res) => {
  const query = {};
  if (req.query.status && ["draft", "published", "scheduled", "archived"].includes(req.query.status)) {
    query.status = req.query.status;
  }
  if (req.query.category && /^[a-f\d]{24}$/i.test(req.query.category)) {
    query.category = req.query.category;
  }

  const articles = await Article.find(query)
    .populate("category", "name slug")
    .sort({ updatedAt: -1 })
    .limit(300)
    .lean();

  res.json({ articles });
});

// Story Preview for admin (allows viewing drafts, scheduled, archived)
router.get("/articles/:id/preview", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid story identifier." });
  }

  const article = await Article.findById(req.params.id)
    .populate("category", "name slug description")
    .lean();

  if (!article) {
    return res.status(404).json({ error: "Story not found." });
  }

  res.json({ article });
});

// Create article
router.post("/articles", async (req, res) => {
  const input = parseArticle(req.body);

  // Check slug uniqueness; if already exists, append random suffix
  let slug = input.slug;
  const existing = await Article.findOne({ slug });
  if (existing) {
    slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
  }

  const article = await Article.create({ ...input, slug });
  await article.populate("category", "name slug");

  logSecurityEvent("ARTICLE_CREATED", {
    admin: req.admin.email,
    id: article._id,
    title: article.title,
    status: article.status
  });

  res.status(201).json({ article });
});

// Update article
router.put("/articles/:id", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid story identifier." });
  }

  const input = parseArticle(req.body);

  // If slug was changed, verify it doesn't collide with another article
  const existingSlug = await Article.findOne({ slug: input.slug, _id: { $ne: req.params.id } });
  if (existingSlug) {
    return res.status(409).json({ error: "That URL slug is already taken by another story." });
  }

  const article = await Article.findByIdAndUpdate(
    req.params.id,
    { ...input, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate("category", "name slug");

  if (!article) {
    return res.status(404).json({ error: "Story not found." });
  }

  logSecurityEvent("ARTICLE_UPDATED", {
    admin: req.admin.email,
    id: article._id,
    title: article.title,
    status: article.status
  });

  res.json({ article });
});

// Fast toggle article status (publish, draft, archive)
router.patch("/articles/:id/status", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid story identifier." });
  }

  const { status } = req.body;
  if (!["draft", "published", "scheduled", "archived"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }

  const article = await Article.findByIdAndUpdate(
    req.params.id,
    { status, updatedAt: new Date() },
    { new: true }
  ).populate("category", "name slug");

  if (!article) return res.status(404).json({ error: "Story not found." });

  logSecurityEvent("ARTICLE_STATUS_CHANGED", { admin: req.admin.email, id: article._id, status });
  res.json({ article });
});

// Fast toggle breaking news
router.patch("/articles/:id/breaking", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid story identifier." });
  }

  const isBreaking = Boolean(req.body.isBreaking);
  const breakingPriority = Number(req.body.breakingPriority) || 0;

  const article = await Article.findByIdAndUpdate(
    req.params.id,
    { isBreaking, breakingPriority, updatedAt: new Date() },
    { new: true }
  ).populate("category", "name slug");

  if (!article) return res.status(404).json({ error: "Story not found." });

  logSecurityEvent("ARTICLE_BREAKING_TOGGLED", { admin: req.admin.email, id: article._id, isBreaking });
  res.json({ article });
});

// Delete article
router.delete("/articles/:id", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid story identifier." });
  }

  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) {
    return res.status(404).json({ error: "Story not found." });
  }

  logSecurityEvent("ARTICLE_DELETED", { admin: req.admin.email, id: req.params.id, title: article.title });
  res.json({ ok: true });
});

// Categories Management
router.get("/categories", async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  res.json({ categories });
});

router.post("/categories", async (req, res) => {
  const parsed = categoryInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Check category name and URL slug." });
  }
  const category = await Category.create(parsed.data);
  logSecurityEvent("CATEGORY_CREATED", { admin: req.admin.email, name: category.name });
  res.status(201).json({ category });
});

router.put("/categories/:id", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid category identifier." });
  }
  const parsed = categoryInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Check category name and URL slug." });
  }
  const category = await Category.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ error: "Category not found." });
  logSecurityEvent("CATEGORY_UPDATED", { admin: req.admin.email, name: category.name });
  res.json({ category });
});

router.delete("/categories/:id", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid category identifier." });
  }
  const articleCount = await Article.countDocuments({ category: req.params.id });
  if (articleCount) {
    return res.status(409).json({ error: `Cannot delete category: ${articleCount} article(s) still belong to it. Reassign or delete them first.` });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found." });
  logSecurityEvent("CATEGORY_DELETED", { admin: req.admin.email, id: req.params.id });
  res.json({ ok: true });
});

// Newsletter subscribers management
router.get("/subscribers", async (req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 }).limit(1000).select("email consentedAt").lean();
  res.json({ subscribers });
});

router.delete("/subscribers/:id", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid subscriber identifier." });
  }
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
  if (!subscriber) return res.status(404).json({ error: "Subscriber not found." });
  logSecurityEvent("SUBSCRIBER_DELETED", { admin: req.admin.email, id: req.params.id });
  res.json({ ok: true });
});

// Secure image upload handler
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please choose an image file to upload." });
  }

  // Deep inspection: verify file magic numbers match declared MIME type
  const isValidContent = validateImageMagicBytes(req.file.buffer, req.file.mimetype);
  if (!isValidContent) {
    logSecurityEvent("MALICIOUS_UPLOAD_BLOCKED", {
      admin: req.admin.email,
      ip: req.ip,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    return res.status(400).json({ error: "The uploaded file content does not match a valid image format." });
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  // Option A: Cloudinary cloud storage
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    try {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
      });
      const image = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "meridian-record", resource_type: "image", allowed_formats: ["jpg", "png", "webp", "avif"] },
          (error, result) => {
            if (error) return reject(new Error("Image upload to cloud provider failed."));
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      logSecurityEvent("IMAGE_UPLOAD_CLOUDINARY", { admin: req.admin.email, url: image.secure_url });
      return res.status(201).json({ url: image.secure_url });
    } catch (uploadError) {
      console.error("Cloudinary upload failed, falling back to local storage:", uploadError.message);
    }
  }

  // Option B: Local secure static storage with randomized UUID
  const extMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif"
  };
  const extension = extMap[req.file.mimetype] || ".jpg";
  const safeFilename = `${crypto.randomUUID()}${extension}`;
  const filePath = path.join(localUploadsDir, safeFilename);

  await fs.writeFile(filePath, req.file.buffer);
  const publicUrl = `/uploads/${safeFilename}`;

  logSecurityEvent("IMAGE_UPLOAD_LOCAL", { admin: req.admin.email, filename: safeFilename });
  res.status(201).json({ url: publicUrl });
});

export default router;
