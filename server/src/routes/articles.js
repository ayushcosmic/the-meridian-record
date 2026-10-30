import { Router } from "express";
import Article from "../models/Article.js";
import Category from "../models/Category.js";
import { escapeRegex } from "../lib/validation.js";

const router = Router();

export const publicFilter = () => ({
  $or: [
    { status: "published", publishAt: { $lte: new Date() } },
    { status: "scheduled", publishAt: { $lte: new Date() } }
  ]
});

// Listing / Search endpoint
router.get("/", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const filter = publicFilter();

  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const q = escapeRegex(req.query.q.trim().slice(0, 100));
    filter.$and = [
      {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { summary: { $regex: q, $options: "i" } },
          { body: { $regex: q, $options: "i" } },
          { tags: { $regex: q, $options: "i" } },
          { author: { $regex: q, $options: "i" } }
        ]
      }
    ];
  }

  if (typeof req.query.category === "string" && req.query.category.trim()) {
    const category = await Category.findOne({ slug: req.query.category.toLowerCase().trim() }).select("_id");
    if (!category) {
      return res.json({ articles: [], page, pages: 0, total: 0 });
    }
    filter.category = category._id;
  }

  if (req.query.opinion === "true") {
    filter.isOpinion = true;
  }

  let sort = { publishAt: -1 };
  if (req.query.sort === "popular") {
    sort = { views: -1, publishAt: -1 };
  } else if (req.query.sort === "featured") {
    sort = { isFeatured: -1, publishAt: -1 };
  }

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-body")
      .lean(),
    Article.countDocuments(filter)
  ]);

  res.json({
    articles,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

// Breaking news ticker endpoint
router.get("/breaking", async (req, res) => {
  const articles = await Article.find({ ...publicFilter(), isBreaking: true })
    .populate("category", "name slug")
    .sort({ breakingPriority: -1, publishAt: -1 })
    .limit(8)
    .select("title slug summary publishAt category isBreaking breakingPriority")
    .lean();
  res.json({ articles });
});

// Frontpage Hero Package endpoint: provides lead story, companion dual stories, wire feed, and opinion picks in one call
router.get("/hero-package", async (req, res) => {
  const baseFilter = publicFilter();

  const [leadStory, wireStories, secondaryStories, opinionStories] = await Promise.all([
    // Lead story: highest featured priority or newest
    Article.findOne({ ...baseFilter, isFeatured: true })
      .populate("category", "name slug")
      .sort({ publishAt: -1 })
      .lean()
      .then(async (found) => {
        if (found) return found;
        return Article.findOne(baseFilter)
          .populate("category", "name slug")
          .sort({ publishAt: -1 })
          .lean();
      }),
    // Wire Stories (quick short updates / 6 latest)
    Article.find(baseFilter)
      .populate("category", "name slug")
      .sort({ publishAt: -1 })
      .limit(8)
      .select("title slug summary publishAt readingTime author category isBreaking")
      .lean(),
    // Secondary stories (different from lead)
    Article.find(baseFilter)
      .populate("category", "name slug")
      .sort({ publishAt: -1 })
      .skip(1)
      .limit(2)
      .select("-body")
      .lean(),
    // Opinion columnists
    Article.find({ ...baseFilter, isOpinion: true })
      .populate("category", "name slug")
      .sort({ publishAt: -1 })
      .limit(4)
      .select("-body")
      .lean()
  ]);

  res.json({
    leadStory,
    secondaryStories,
    wireStories,
    opinionStories
  });
});

// Opinion columns endpoint
router.get("/opinion", async (req, res) => {
  const articles = await Article.find({ ...publicFilter(), isOpinion: true })
    .populate("category", "name slug")
    .sort({ publishAt: -1 })
    .limit(6)
    .select("-body")
    .lean();
  res.json({ articles });
});

// Trending stories endpoint
router.get("/trending", async (req, res) => {
  const articles = await Article.find({ ...publicFilter(), isTrending: true })
    .populate("category", "name slug")
    .sort({ views: -1, publishAt: -1 })
    .limit(6)
    .select("-body")
    .lean();
  res.json({ articles });
});

// Editor's picks endpoint
router.get("/editors-picks", async (req, res) => {
  const articles = await Article.find({ ...publicFilter(), isFeatured: true })
    .populate("category", "name slug")
    .sort({ publishAt: -1 })
    .limit(6)
    .select("-body")
    .lean();
  res.json({ articles });
});

// Most popular / read stories
router.get("/popular", async (req, res) => {
  const articles = await Article.find(publicFilter())
    .populate("category", "name slug")
    .sort({ views: -1, publishAt: -1 })
    .limit(6)
    .select("-body")
    .lean();
  res.json({ articles });
});

// Single story detail endpoint
router.get("/:slug", async (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();
  const article = await Article.findOne({ slug, ...publicFilter() })
    .populate("category", "name slug description")
    .lean();

  if (!article) {
    return res.status(404).json({ error: "Story not found or not currently published." });
  }

  // Fetch adjacent previous and next stories for reader continuity
  const [previousStory, nextStory, related] = await Promise.all([
    Article.findOne({ ...publicFilter(), publishAt: { $lt: article.publishAt } })
      .select("title slug publishAt")
      .sort({ publishAt: -1 })
      .lean(),
    Article.findOne({ ...publicFilter(), publishAt: { $gt: article.publishAt } })
      .select("title slug publishAt")
      .sort({ publishAt: 1 })
      .lean(),
    Article.find({
      ...publicFilter(),
      category: article.category._id,
      _id: { $ne: article._id }
    })
      .populate("category", "name slug")
      .sort({ publishAt: -1 })
      .limit(4)
      .select("-body")
      .lean()
  ]);

  res.json({
    article,
    previousStory,
    nextStory,
    related
  });
});

// Increment story view counter
router.post("/:id/view", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid story identifier." });
  }

  const article = await Article.findOneAndUpdate(
    { _id: req.params.id, ...publicFilter() },
    { $inc: { views: 1 } },
    { new: true, timestamps: false }
  ).select("_id views");

  if (!article) {
    return res.status(404).json({ error: "Story not found." });
  }

  res.json({ views: article.views });
});

export default router;
