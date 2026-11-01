# The Meridian Record

An original, high-density, secure digital newspaper publication built with **React**, **Vite**, **Express**, and **MongoDB**. Inspired by the editorial presentation, visual density, and authoritative visual hierarchy of premier broadsheets and digital news publications (CNN, Daily Mail, New York Post), with completely original branding, typography, and architecture.

---

## Key Features

### 1. Editorial Presentation & Visual Hierarchy
- **Master Masthead & Utility Strip:** Features live dateline, Global/India edition switcher, real-time market tracker indices (Brent Crude, Sensex, Dow), and original "MR" heraldic crest monogram.
- **Administrator-Controlled Breaking News Ticker:** Urgent flashing alert banner with cycling headlines, pause/play controls, direct article links, and priority management.
- **Full Editorial Taxonomy (11 Desks):** World, India, Politics, Geopolitics, Business, Technology, Defence, Science, Opinion, Entertainment, and Sports.
- **3-Column Hero Frontpage Package:**
  - *Left Rail:* "The News Wire" — high-density stream of breaking wire reports with live pulse indicators and relative timestamps ("12m ago").
  - *Center Column:* The Lead Story Package — extra-large high-resolution hero photo, bold editorial headline, bulleted key takeaways, and secondary doublet companions.
  - *Right Rail:* "Most Read" — ranked #1 through #5 with oversized broadsheet numerals, companion opinion voices, and sidebar display placements.
- **Thematic Section Layouts:**
  - *Defence & Geopolitics:* 4-card strategic briefing deck.
  - *India & Governance:* Composite hero card plus compact news stack.
  - *Business & Global Markets:* Financial analysis and trade reporting.
  - *Technology & Science:* Semiconductor, AI, and aerospace reporting.
  - *Opinion & Broadsheet Columns:* Distinctive sepia paper cards with author avatars, quotes, and columnist bylines.
- **Article Presentation Suite:**
  - Drop-cap opening paragraph, pull quotes, bullet takeaway summaries, reading time estimates, author biography cards, and adjacent previous/next story navigation.
  - Social sharing suite (Twitter/X, WhatsApp, LinkedIn, Facebook, Native Share, and Link Copy with toast feedback).
  - Accessibility tools (A- / A+ font size adjustment, Reading mode, Print stylesheet, and local bookmarking).
  - Editorial correction notices and sponsored content disclaimers.
- **Editorial Trust Pages:** Complete About Us, Editorial & Sourcing Policy, Corrections & Retractions Policy, Privacy Notice, Terms of Service, Confidential Tip Line, and Advertising Media Kit.

### 2. Admin-Only Publishing System
- Protected command suite for the authorized administrator:
  - **Article CRUD:** Create, edit, live preview, publish, schedule for future release, unpublish to draft, archive, and permanently delete.
  - **Live Side-by-Side Markdown Editor:** Instant real-time preview showing exactly how the published story renders as you compose.
  - **Editorial Flags:** Mark stories as Breaking News (with priority 0–100), Frontpage Lead Feature, Trending, Opinion Column, or Sponsored Content.
  - **SEO Metadata:** Custom meta title, meta description, canonical URL overrides, and focus keywords.
  - **Editorial Corrections Manager:** Append formal timestamped correction notices to existing stories.
  - **Breaking News Controller:** Dedicated panel to toggle breaking stories or broadcast a custom ticker banner.
  - **Monetization & AdSense Panel:** Configure Google AdSense Publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`), Header Slot ID, Sidebar Slot ID, and In-Article Slot ID.
  - **Category Manager:** Add, edit, reorder, or delete sections with article conflict validation.
  - **Audience & Analytics:** Live traffic counter, top 10 most-read articles ranking, and consented newsletter subscriber management.
  - **Security & Credential Rotation:** In-app secure administrator password rotation with strict complexity enforcement.

### 3. Cybersecurity Architecture
- **Authentication & Sessions:**
  - Password hashing with bcrypt (12 salt rounds).
  - Encrypted, HttpOnly, SameSite ("lax") session cookies with automatic token ID generation (`jti`).
  - Progressive brute-force lockout: 5 consecutive failed attempts trigger a 15-minute account lockout.
  - Login rate-limiting (8 attempts per 15 minutes) and global API rate limits (500 requests per 15 minutes).
- **Authorization & Data Privacy:**
  - Deny administrative access by default. Backend checks on every write, publish, delete, upload, and settings route.
  - `publicFilter()` strictly enforces that `draft`, `archived`, and future `scheduled` stories are **never** returned by public APIs or direct URLs.
- **CSRF & Injection Defenses:**
  - Origin verification (`requireSameOrigin`) on all state-mutating requests (POST, PUT, PATCH, DELETE).
  - Input validation via explicit Zod schemas across bodies, query parameters, and IDs.
  - Regex sanitization (`escapeRegex`) preventing regex-DoS and NoSQL injection.
  - Helmet security headers with carefully tuned Content Security Policy compatible with Google AdSense, Google Fonts, and images.
  - Safe image upload handler verifying MIME types and inspecting binary magic numbers (JPEG, PNG, WebP, AVIF) with 5 MB file size limit and non-executable static serving.
  - Structured security audit logger recording authentication events without logging credentials or secrets.

### 4. Monetization & Google AdSense Readiness
- Reusable, policy-compliant `AdSlot` components for:
  - Top Leaderboard (728 × 90 desktop / 320 × 50 mobile)
  - Sidebar Medium Rectangle (300 × 250) and Half Page (300 × 600)
  - In-Feed Banner (between homepage sections)
  - In-Article Stream (midway through long-form stories)
- Supports real Publisher ID and Slot IDs configured via the Admin panel or environment variables.
- When unconfigured or in preview mode, displays clear, tasteful, non-deceptive placeholders clearly marked "ADVERTISEMENT" with exact IAB dimensions.
- Zero fake clicks, zero deceptive styling, fully compliant with Google AdSense Program Policies.

### 5. SEO & News Discovery
- Dynamic human-readable URLs (`/story/:slug`).
- Automated OpenGraph and Twitter Card metadata with responsive imagery.
- Structured Data: `NewsArticle` schema (JSON-LD) with author, publisher, publication dates, and canonical tags.
- Dynamic XML Sitemaps:
  - `/sitemap.xml` — Standard search engine index sitemap.
  - `/news-sitemap.xml` — Google News compliant XML sitemap for stories published in the past 48 hours.
  - `/feed.xml` / `/rss.xml` — RSS 2.0 syndication feed.
  - `/robots.txt` — Search crawler directives protecting admin endpoints.

---

## Project Structure

```text
client/                     Vite + React frontend
  src/
    components/             Header, Footer, AdSlot, StoryCard, Newsletter, States
    pages/                  Home, Listing, Article, Admin, Info (Trust pages & 404)
    lib/                    api.js, format.js
    styles.css              Editorial stylesheet (desktop, tablet, mobile, print)
server/                     Node.js + Express API
  src/
    config/                 db.js, env.js
    lib/                    validation.js, logger.js
    middleware/             auth.js (requireAdmin, requireSameOrigin), errors.js
    models/                 Article.js, Category.js, Setting.js, Subscriber.js, User.js
    routes/                 admin.js, articles.js, auth.js, categories.js, newsletter.js, settings.js
    scripts/                seed.js, seed-admin.js
    security.test.js        10-point automated security test suite
    validation.test.js      Zod schema & sanitization test suite
```

---

## Local Setup & Run Guide (Windows PowerShell)

### 1. Prerequisites
- Node.js 20+ (tested on Node 22).
- MongoDB installed locally on `127.0.0.1:27017` or a MongoDB Atlas cluster URI.

### 2. Environment Configuration
From the project folder:

```powershell
Copy-Item .env.example .env
notepad .env
```

Generate a secure random secret for `JWT_SECRET`:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Configure in `.env`:
- `JWT_SECRET`: The generated random secret (at least 32 characters).
- `ADMIN_EMAIL`: Your primary publisher email (e.g., `editor@meridianrecord.com`).
- `ADMIN_PASSWORD`: A strong password (at least 12 characters, including uppercase, lowercase, and numbers).
- `MONGODB_URI`: `mongodb://127.0.0.1:27017/meridian_record` (or your Atlas connection string).

### 3. Database Seeding
Initialize the 11 newsroom categories, default publication settings, and demonstration articles:

```powershell
npm.cmd run seed -w server
```

Seed the initial administrator account:
```powershell
npm.cmd run seed:admin -w server
```

### 4. Running the Development Server
Launch both the Express API and Vite React client simultaneously:

```powershell
npm.cmd run dev
```

- Public Newsroom Website: `http://localhost:5173`
- API Health Endpoint: `http://localhost:4000/api/health`
- Admin Publishing Portal: `http://localhost:5173/admin`

---

## Testing & Acceptance Verification

Run the automated security and validation test suites:

```powershell
npm.cmd test -w server
```

### Verified Test Results (11/11 Passed):
1. **Unauthenticated Admin Access:** 401 Unauthorized strictly enforced.
2. **CSRF Protection:** Mismatched origins on mutating requests return 403 Forbidden.
3. **Public API Isolation:** Draft, scheduled, and archived stories are never returned to public visitors.
4. **Password Complexity:** Rejects short, weak, or easily guessable passwords.
5. **Malicious Input Defense:** Malformed slugs, path traversals (`../../../`), and protocol smuggling (`javascript:`, `http:`) are rejected.
6. **Google AdSense Validation:** Verifies publisher IDs conform to `ca-pub-XXXXXXXXXXXXXXXX` and slot IDs are strictly numeric.
7. **Secrets Leak Prevention:** Client source code audited to verify private server secrets are never bundled into client assets.
8. **Regex Sanitization:** Metacharacters escaped to prevent NoSQL injection.
9. **Article Parsing:** Correctly casts publication timestamps and validates required metadata.
10. **Client Build:** Vite production bundle compiles cleanly with 0 errors.

---

## Database Backup and Recovery

### Backup (MongoDB Dump)
```powershell
mongodump --uri="mongodb://127.0.0.1:27017/meridian_record" --out="C:\backups\meridian_$(Get-Date -Format 'yyyyMMdd_HHmm')"
```

### Restore (MongoDB Restore)
```powershell
mongorestore --uri="mongodb://127.0.0.1:27017/meridian_record" --drop "C:\backups\meridian_20261030_0000\meridian_record"
```

---

## Deployment on Vercel + Render

This project is already prepared for a typical Vercel + Render deployment:

- The Express API is configured in `render.yaml` with a health check at `/api/health`.
- The React/Vite frontend is configured in `client/vercel.json` for SPA routing.
- The frontend expects a `VITE_API_URL` environment variable to point to the deployed Render API.

### Vercel frontend setup
1. Import the GitHub repository into Vercel.
2. Set the project root to the `client/` folder if you deploy the frontend as a separate app.
3. Add this environment variable in the Vercel dashboard:

```bash
VITE_API_URL=https://your-render-service.onrender.com/api
```

The client also appends `/api` when the URL is provided without that path.

4. Keep the default `npm install` and `npm run build` commands for the Vite app.

### Render backend setup
1. Create a new Render Web Service and connect the same repo.
2. In the service settings, use the included `render.yaml` file.
3. Add or confirm the production environment variables:

```bash
NODE_ENV=production
PORT=10000
CLIENT_URL=https://your-vercel-app.vercel.app
SITE_URL=https://your-vercel-app.vercel.app
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=<long-random-secret>
ADMIN_EMAIL=editor@meridianrecord.com
ADMIN_PASSWORD=<strong-admin-password>
COOKIE_SECURE=true
```

4. Deploy the service and verify `https://your-render-service.onrender.com/api/health` returns `200 OK`.

### Local production-like checks
```powershell
npm.cmd run build
npm.cmd test -w server
```

---

## Production Deployment & HTTPS Checklist

1. **Enforce HTTPS:** Set `COOKIE_SECURE=true` and `NODE_ENV=production` in production environment variables. Admin session cookies will strictly require HTTPS.
2. **Configure Origins:** Set `CLIENT_URL` and `SITE_URL` to your exact production domain (e.g., `https://www.meridianrecord.com`).
3. **Google AdSense Connection:**
   - Sign in to the Admin Dashboard at `/admin`.
   - Open the **Monetization & Ads** tab.
   - Enter your real AdSense Publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`) and slot IDs.
   - Click **Save Monetization Settings**.
   - Submit your domain in the Google AdSense Console for site review.
4. **Google Search Console & News:**
   - Submit your sitemap at `https://yourdomain.com/sitemap.xml`.
   - Submit your Google News sitemap at `https://yourdomain.com/news-sitemap.xml`.
