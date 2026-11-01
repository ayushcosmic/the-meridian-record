import "./config/env.js";
import "express-async-errors";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { connectDatabase } from "./config/db.js";
import authRoutes, { loginLimit } from "./routes/auth.js";
import articleRoutes from "./routes/articles.js";
import categoryRoutes from "./routes/categories.js";
import newsletterRoutes from "./routes/newsletter.js";
import settingsRoutes from "./routes/settings.js";
import adminRoutes from "./routes/admin.js";
import { notFound, errorHandler } from "./middleware/errors.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const siteUrl = process.env.SITE_URL || clientUrl;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);

// Helmet with Google AdSense, Google Fonts, and secure strict defaults
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://pagead2.googlesyndication.com",
          "https://adservice.google.com",
          "https://partner.googleadservices.com",
          "https://tpc.googlesyndication.com",
          "https://www.googletagservices.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "https:", "data:", "https://pagead2.googlesyndication.com"],
        connectSrc: ["'self'", "https://pagead2.googlesyndication.com", "https://*.google.com"],
        frameSrc: [
          "'self'",
          "https://googleads.g.doubleclick.net",
          "https://pagead2.googlesyndication.com",
          "https://tpc.googlesyndication.com"
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    }
  })
);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((u) => u.trim().replace(/\/$/, ""));

// CORS restricted to configured client origin
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps or curl) and exact client URL
      if (!origin || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      const norm = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(norm) || allowedOrigins.some((ao) => norm.endsWith(".vercel.app"))) {
        return callback(null, true);
      }
      callback(new Error("CORS origin blocked by policy"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());

// Static uploads serving with execution-disabled headers
const uploadsDir = path.resolve(root, "server", "uploads");
app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'");
    }
  })
);

// Global API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Specific brute-force protection on admin login
app.use("/api/auth/login", rateLimit(loginLimit));

app.get("/", (req, res) =>
  res.json({
    service: "The Meridian Record API",
    status: "ok",
    website: clientUrl,
    health: "/api/health",
    articles: "/api/articles"
  })
);

// Health check endpoint
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "The Meridian Record API", time: new Date().toISOString() }));

// Register feature routes
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);

// Robots.txt
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: ${siteUrl}/sitemap.xml\nSitemap: ${siteUrl}/news-sitemap.xml\n`
  );
});

// Dynamic XML Sitemap
app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const Article = (await import("./models/Article.js")).default;
    const articles = await Article.find({
      $or: [
        { status: "published", publishAt: { $lte: new Date() } },
        { status: "scheduled", publishAt: { $lte: new Date() } }
      ]
    })
      .select("slug updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50000)
      .lean();

    const base = siteUrl;
    const urls = articles
      .map(
        (article) =>
          `<url><loc>${base}/story/${encodeURIComponent(article.slug)}</loc><lastmod>${new Date(
            article.updatedAt
          ).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      )
      .join("");

    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>${urls}</urlset>`
    );
  } catch (error) {
    next(error);
  }
});

// Google News XML Sitemap (stories published within the last 48 hours)
app.get("/news-sitemap.xml", async (req, res, next) => {
  try {
    const Article = (await import("./models/Article.js")).default;
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const articles = await Article.find({
      $or: [
        { status: "published", publishAt: { $gte: twoDaysAgo, $lte: new Date() } },
        { status: "scheduled", publishAt: { $gte: twoDaysAgo, $lte: new Date() } }
      ]
    })
      .select("title slug publishAt")
      .sort({ publishAt: -1 })
      .limit(1000)
      .lean();

    const base = siteUrl;
    const items = articles
      .map((article) => {
        const safeTitle = article.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<url>
  <loc>${base}/story/${encodeURIComponent(article.slug)}</loc>
  <news:news>
    <news:publication>
      <news:name>The Meridian Record</news:name>
      <news:language>en</news:language>
    </news:publication>
    <news:publication_date>${new Date(article.publishAt).toISOString()}</news:publication_date>
    <news:title>${safeTitle}</news:title>
  </news:news>
</url>`;
      })
      .join("\n");

    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`
    );
  } catch (error) {
    next(error);
  }
});

// RSS 2.0 Feed
app.get(["/feed.xml", "/rss.xml"], async (req, res, next) => {
  try {
    const Article = (await import("./models/Article.js")).default;
    const articles = await Article.find({
      $or: [
        { status: "published", publishAt: { $lte: new Date() } },
        { status: "scheduled", publishAt: { $lte: new Date() } }
      ]
    })
      .populate("category", "name")
      .sort({ publishAt: -1 })
      .limit(30)
      .select("title slug summary author publishAt category")
      .lean();

    const base = siteUrl;
    const items = articles
      .map((article) => {
        const safeTitle = article.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeSummary = article.summary.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `    <item>
      <title>${safeTitle}</title>
      <link>${base}/story/${encodeURIComponent(article.slug)}</link>
      <description>${safeSummary}</description>
      <author>${article.author}</author>
      <category>${article.category?.name || "General"}</category>
      <pubDate>${new Date(article.publishAt).toUTCString()}</pubDate>
      <guid>${base}/story/${encodeURIComponent(article.slug)}</guid>
    </item>`;
      })
      .join("\n");

    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Meridian Record</title>
    <link>${base}</link>
    <description>Independent reporting and clear-eyed analysis of world affairs, India, geopolitics, and technology.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`
    );
  } catch (error) {
    next(error);
  }
});

// Serve production frontend bundle
const clientDist = path.resolve(root, "..", "client", "dist");
if (process.env.NODE_ENV === "production" && existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: "1d" }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

export async function startServer() {
  await connectDatabase();
  return app.listen(port, () => console.log(`The Meridian Record API listening on port ${port}`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer().catch((error) => {
    console.error("Could not start API:", error.message);
    process.exitCode = 1;
  });
}

export default app;
