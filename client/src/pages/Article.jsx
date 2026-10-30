import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";
import { api } from "../lib/api";
import { formatDate, formatDateTime, timeAgo } from "../lib/format";
import StoryCard from "../components/StoryCard";
import AdSlot from "../components/AdSlot";
import { ErrorState, Loading, EmptyState } from "../components/States";

function absoluteUrl(path) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export default function Article() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [previousStory, setPreviousStory] = useState(null);
  const [nextStory, setNextStory] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1, 0, +1, +2
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [settings, setSettings] = useState(null);
  const lastViewedSlug = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    let active = true;
    setArticle(null);
    setError("");

    // Check bookmark state from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("meridian_bookmarks") || "[]");
      setIsBookmarked(saved.includes(slug));
    } catch {}

    api(`/articles/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!active) return;
        setArticle(data.article);
        setPreviousStory(data.previousStory);
        setNextStory(data.nextStory);
        setRelated(data.related || []);

        // Debounced view count registration
        if (lastViewedSlug.current !== slug) {
          lastViewedSlug.current = slug;
          api(`/articles/${data.article._id}/view`, { method: "POST" }).catch(() => {});
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    api("/settings/public")
      .then((data) => {
        if (active) setSettings(data.settings);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [slug]);

  // Reading progress bar
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar || !article) return;
    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      bar.style.width = `${progress}%`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [article]);

  function toggleBookmark() {
    try {
      const saved = JSON.parse(localStorage.getItem("meridian_bookmarks") || "[]");
      let updated;
      if (saved.includes(slug)) {
        updated = saved.filter((s) => s !== slug);
        setIsBookmarked(false);
        setShareFeedback("Removed from bookmarks");
      } else {
        updated = [...saved, slug];
        setIsBookmarked(true);
        setShareFeedback("Story bookmarked");
      }
      localStorage.setItem("meridian_bookmarks", JSON.stringify(updated));
      setTimeout(() => setShareFeedback(""), 3000);
    } catch {}
  }

  function handleShare(platform) {
    const url = absoluteUrl(`/story/${slug}`);
    const title = article?.title || "";

    if (platform === "native") {
      if (navigator.share) {
        navigator.share({ title, text: article?.summary, url }).catch(() => {});
      } else {
        handleShare("copy");
      }
      return;
    }

    if (platform === "copy") {
      navigator.clipboard.writeText(url).then(() => {
        setShareFeedback("Story link copied to clipboard!");
        setTimeout(() => setShareFeedback(""), 4000);
      });
      return;
    }

    let shareUrl = "";
    if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    } else if (platform === "whatsapp") {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`;
    } else if (platform === "linkedin") {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    } else if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=450");
    }
  }

  if (error) {
    return (
      <main className="container page-content">
        <ErrorState error={error} />
      </main>
    );
  }

  if (!article) {
    return (
      <main className="container page-content">
        <div className="article-layout-grid">
          <div className="article-main-column">
            <div className="skeleton-article-header">
              <div className="skeleton-article-img" />
              <div className="skeleton-article-title" />
              <div className="skeleton-article-deck" />
              <div className="skeleton-article-deck" style={{ width: '50%' }} />
              <div className="skeleton-article-byline" style={{ marginTop: '16px' }} />
            </div>
            <div className="skeleton-article-body">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton-line" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const canonical = article.canonicalUrl || absoluteUrl(`/story/${article.slug}`);
  const metaTitle = article.metaTitle || `${article.title} | The Meridian Record`;
  const metaDescription = article.metaDescription || article.summary;

  // Split article body for mid-article ad insertion
  const bodyParagraphs = article.body.split("\n\n");
  const midpoint = Math.max(2, Math.floor(bodyParagraphs.length / 2));
  const bodyFirstHalf = bodyParagraphs.slice(0, midpoint).join("\n\n");
  const bodySecondHalf = bodyParagraphs.slice(midpoint).join("\n\n");

  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.publishAt,
    dateModified: article.updatedAt || article.publishAt,
    author: [
      {
        "@type": "Person",
        name: article.author,
        jobTitle: article.authorRole || "Staff Correspondent"
      }
    ],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "The Meridian Record",
      url: absoluteUrl("/")
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical
    }
  };

  const fontSizes = ["font-size-sm", "font-size-base", "font-size-lg", "font-size-xl"];
  const currentFontClass = fontSizes[fontSizeLevel + 1] || "font-size-base";

  return (
    <main className="article-page-wrap">
      <div ref={progressRef} className="reading-progress-bar" style={{ width: '0%' }} aria-hidden="true" />
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription.slice(0, 300)} />
        <link rel="canonical" href={canonical} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary} />
        <meta property="og:url" content={canonical} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}

        <meta name="twitter:card" content={article.imageUrl ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary} />
        {article.imageUrl && <meta name="twitter:image" content={article.imageUrl} />}

        <script type="application/ld+json">
          {JSON.stringify(newsArticleJsonLd).replace(/</g, "\\u003c")}
        </script>
      </Helmet>

      {/* Top Banner Advertisement */}
      <div className="container ad-leaderboard-wrap">
        <AdSlot
          slotType="leaderboard"
          clientId={settings?.adsenseClientId}
          slotId={settings?.adsenseHeaderSlot}
        />
      </div>

      <div className="container article-layout-grid">
        {/* Main Article Column */}
        <article className="article-main-column">
          {/* Breadcrumb Navigation */}
          <nav className="article-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">›</span>
            <Link to={`/category/${article.category?.slug}`}>{article.category?.name}</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{article.title}</span>
          </nav>

          {/* Article Header Package */}
          <header className="article-full-header">
            <div className="article-kicker-bar">
              <Link className="article-category-kicker" to={`/category/${article.category?.slug}`}>
                {article.category?.name}
              </Link>
              {article.isBreaking && <span className="breaking-badge">BREAKING NEWS</span>}
              {article.isOpinion && <span className="opinion-label">OPINION COLUMN</span>}
              {article.isSponsored && <span className="sponsored-label">SPONSORED REPORT</span>}
            </div>

            <h1 className="article-headline-main">{article.title}</h1>

            <p className="article-deck-standfirst">{article.summary}</p>

            {/* Author Byline & Timestamps */}
            <div className="article-byline-cluster">
              <div className="byline-avatar-box" aria-hidden="true">
                {article.author
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="byline-details">
                <div className="byline-name-row">
                  <span className="author-name">By <strong>{article.author}</strong></span>
                  <span className="author-role">{article.authorRole || "Correspondent"}</span>
                </div>
                <div className="byline-dates-row">
                  <span>Published <time dateTime={article.publishAt}>{formatDateTime(article.publishAt)}</time></span>
                  {article.updatedAt && article.updatedAt !== article.publishAt && (
                    <span>· Updated <time dateTime={article.updatedAt}>{timeAgo(article.updatedAt)}</time></span>
                  )}
                  {article.readingTime && <span>· ⏱ {article.readingTime} min read</span>}
                </div>
              </div>
            </div>

            {/* Social Sharing & Accessibility Toolbar */}
            <div className="article-actions-toolbar">
              <div className="share-buttons-group">
                <span className="share-label">SHARE:</span>
                <button
                  type="button"
                  className="share-icon-btn share-twitter"
                  onClick={() => handleShare("twitter")}
                  title="Share on X / Twitter"
                  aria-label="Share on X"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <button
                  type="button"
                  className="share-icon-btn share-whatsapp"
                  onClick={() => handleShare("whatsapp")}
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </button>
                <button
                  type="button"
                  className="share-icon-btn share-linkedin"
                  onClick={() => handleShare("linkedin")}
                  title="Share on LinkedIn"
                  aria-label="Share on LinkedIn"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </button>
                <button
                  type="button"
                  className="share-icon-btn share-fb"
                  onClick={() => handleShare("facebook")}
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
                <button
                  type="button"
                  className="share-icon-btn share-copy"
                  onClick={() => handleShare("copy")}
                  title="Copy link"
                  aria-label="Copy story link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                </button>
                {shareFeedback && <span className="share-feedback-pill" role="status">{shareFeedback}</span>}
              </div>

              <div className="reading-utilities-group">
                <button
                  type="button"
                  className="util-btn"
                  onClick={() => setFontSizeLevel((prev) => Math.max(-1, prev - 1))}
                  title="Decrease text size"
                  aria-label="Decrease text size"
                >
                  A-
                </button>
                <button
                  type="button"
                  className="util-btn"
                  onClick={() => setFontSizeLevel((prev) => Math.min(2, prev + 1))}
                  title="Increase text size"
                  aria-label="Increase text size"
                >
                  A+
                </button>
                <button
                  type="button"
                  className={`util-btn bookmark-btn ${isBookmarked ? "active-bookmark" : ""}`}
                  onClick={toggleBookmark}
                  title={isBookmarked ? "Story saved in bookmarks" : "Save story"}
                  aria-label="Bookmark story"
                >
                  {isBookmarked ? "★ Saved" : "☆ Save"}
                </button>
                <button
                  type="button"
                  className="util-btn print-btn"
                  onClick={() => window.print()}
                  title="Print this story"
                  aria-label="Print story"
                >
                  🖨 Print
                </button>
              </div>
            </div>
          </header>

          {/* Hero Image Package */}
          {article.imageUrl && (
            <figure className="article-hero-figure">
              <img
                src={article.imageUrl}
                alt={article.imageAlt || article.title}
                fetchPriority="high"
              />
              <figcaption className="hero-figcaption">
                <span className="caption-text">{article.imageAlt || article.title}</span>
                {article.imageCredit && (
                  <span className="credit-text"> · Credit: {article.imageCredit}</span>
                )}
              </figcaption>
            </figure>
          )}

          {/* Sponsored Content Disclosure Banner */}
          {article.isSponsored && (
            <div className="sponsored-disclosure-box" role="note">
              <strong>SPONSORED EDITORIAL FEATURE</strong>
              <p>
                {settings?.sponsoredDisclaimer ||
                  "This content is presented in partnership with an external sponsor. The Meridian Record maintains transparent separation between commercial partnerships and independent news reporting."}
              </p>
            </div>
          )}

          {/* Formal Editorial Correction Notice */}
          {article.corrections?.length > 0 && (
            <div className="editorial-corrections-box" role="alert">
              <strong>CORRECTION &amp; CLARIFICATION NOTICE</strong>
              {article.corrections.map((corr, i) => (
                <div key={i} className="correction-entry">
                  <span className="correction-date">{formatDate(corr.date)}:</span>{" "}
                  <span className="correction-text">{corr.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Article Markdown Body */}
          <div className={`article-prose-body ${currentFontClass}`}>
            {/* First half of text */}
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h2 className="article-subhead">{children}</h2>,
                h2: ({ children }) => <h2 className="article-subhead">{children}</h2>,
                h3: ({ children }) => <h3 className="article-subhead-minor">{children}</h3>,
                blockquote: ({ children }) => <blockquote className="editorial-pull-quote">{children}</blockquote>
              }}
            >
              {bodyFirstHalf}
            </ReactMarkdown>

            {/* Mid-Article In-Stream Advertisement */}
            {bodySecondHalf && (
              <div className="in-article-ad-box">
                <AdSlot
                  slotType="in-article"
                  clientId={settings?.adsenseClientId}
                  slotId={settings?.adsenseInArticleSlot}
                />
              </div>
            )}

            {/* Second half of text */}
            {bodySecondHalf && (
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h2 className="article-subhead">{children}</h2>,
                  h2: ({ children }) => <h2 className="article-subhead">{children}</h2>,
                  h3: ({ children }) => <h3 className="article-subhead-minor">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="editorial-pull-quote">{children}</blockquote>
                }}
              >
                {bodySecondHalf}
              </ReactMarkdown>
            )}
          </div>

          {/* Tags Chips */}
          {article.tags?.length > 0 && (
            <div className="article-tags-cluster">
              <span className="tags-label">TOPICS:</span>
              {article.tags.map((tag) => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="topic-tag-chip">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Author Bio Card */}
          <section className="author-biography-card">
            <div className="author-bio-avatar" aria-hidden="true">
              {article.author
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="author-bio-content">
              <h3>About {article.author}</h3>
              <p>
                {article.author} serves as {article.authorRole || "Staff Correspondent"} for The Meridian Record,
                covering strategic developments, foreign policy, and institutional governance.
                Reporting complies with The Meridian Record's verified sourcing standards.
              </p>
              <div className="author-bio-links">
                <Link to={`/search?q=${encodeURIComponent(article.author)}`}>
                  All articles by {article.author} →
                </Link>
              </div>
            </div>
          </section>

          {/* Next / Previous Story Navigation */}
          <nav className="story-pagination-nav" aria-label="Adjacent stories">
            {previousStory ? (
              <Link to={`/story/${previousStory.slug}`} className="prev-story-link">
                <span className="direction-label">← PREVIOUS STORY</span>
                <span className="story-title-preview">{previousStory.title}</span>
              </Link>
            ) : <div />}

            {nextStory ? (
              <Link to={`/story/${nextStory.slug}`} className="next-story-link">
                <span className="direction-label">NEXT STORY →</span>
                <span className="story-title-preview">{nextStory.title}</span>
              </Link>
            ) : <div />}
          </nav>
        </article>

        {/* Right Sidebar Rail */}
        <aside className="article-sidebar-rail">
          {/* Half Page / Medium Rectangle Ad Slot */}
          <div className="sidebar-sticky-ad">
            <AdSlot
              slotType="rectangle"
              clientId={settings?.adsenseClientId}
              slotId={settings?.adsenseSidebarSlot}
            />
          </div>

          {/* Section Highlights */}
          <div className="sidebar-section-block">
            <div className="sidebar-block-header">
              <h3>MORE IN {article.category?.name?.toUpperCase()}</h3>
              <Link to={`/category/${article.category?.slug}`}>Archive →</Link>
            </div>
            <div className="sidebar-stories-stack">
              {related.length > 0 ? (
                related.map((item) => (
                  <StoryCard key={item._id} article={item} variant="compact" />
                ))
              ) : (
                <EmptyState>No additional stories in this section yet.</EmptyState>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Related Stories Grid */}
      {related.length > 0 && (
        <section className="container related-coverage-section">
          <div className="section-masthead-bar">
            <div className="section-title-lockup">
              <span className="section-flag">CONTINUE READING</span>
              <h2>RELATED INVESTIGATIONS &amp; ANALYSIS</h2>
            </div>
          </div>
          <div className="story-grid story-grid-3">
            {related.slice(0, 3).map((item) => (
              <StoryCard key={item._id} article={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
