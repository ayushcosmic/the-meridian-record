import { Link } from "react-router-dom";
import { formatDate, timeAgo } from "../lib/format";

export default function StoryCard({
  article,
  variant = "standard",
  rank = null,
  showSummary = true,
  imagePriority = false
}) {
  if (!article) return null;

  const categorySlug = article.category?.slug || "world";
  const categoryName = article.category?.name || "News";

  // Variant: Wire story (high density text item for live wire rails)
  if (variant === "wire") {
    return (
      <article className="wire-item">
        <div className="wire-meta">
          <time dateTime={article.publishAt} className="wire-time">
            {timeAgo(article.publishAt)}
          </time>
          <Link to={`/category/${categorySlug}`} className="wire-cat">
            {categoryName}
          </Link>
          {article.isBreaking && <span className="mini-badge breaking-mini">BREAKING</span>}
        </div>
        <h4 className="wire-headline">
          <Link to={`/story/${article.slug}`}>{article.title}</Link>
        </h4>
      </article>
    );
  }

  // Variant: Ranked (Most Read #1 to #5 with giant serif numerals)
  if (variant === "ranked") {
    return (
      <article className="ranked-card">
        {rank !== null && <span className="ranked-number">{rank}</span>}
        <div className="ranked-content">
          <div className="card-kicker-row">
            <Link className="category-label" to={`/category/${categorySlug}`}>
              {categoryName}
            </Link>
            <span className="card-timestamp">{timeAgo(article.publishAt)}</span>
          </div>
          <h3 className="ranked-headline">
            <Link to={`/story/${article.slug}`}>{article.title}</Link>
          </h3>
          <div className="story-byline">
            <span>By {article.author}</span>
            {article.readingTime && <span>· {article.readingTime} min read</span>}
          </div>
        </div>
      </article>
    );
  }

  // Variant: Opinion column card (newspaper sepia/tinted style with author emphasis)
  if (variant === "opinion" || article.isOpinion) {
    return (
      <article className="opinion-card">
        <div className="opinion-author-header">
          <div className="opinion-avatar" aria-hidden="true">
            {article.author
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="opinion-author-meta">
            <span className="opinion-author-name">{article.author}</span>
            <span className="opinion-author-role">{article.authorRole || "Columnist"}</span>
          </div>
        </div>
        <div className="opinion-quote-body">
          <span className="opinion-kicker">COLUMN</span>
          <h3 className="opinion-headline">
            <Link to={`/story/${article.slug}`}>"{article.title}"</Link>
          </h3>
          {showSummary && <p className="opinion-summary">{article.summary}</p>}
        </div>
        <div className="card-footer-meta">
          <time dateTime={article.publishAt}>{timeAgo(article.publishAt)}</time>
          {article.readingTime && <span>{article.readingTime} min read</span>}
        </div>
      </article>
    );
  }

  // Variant: Compact horizontal card (ideal for sidebars and category sub-grids)
  if (variant === "compact") {
    return (
      <article className="story-card-compact">
        {article.imageUrl ? (
          <Link className="compact-image-wrap" to={`/story/${article.slug}`} aria-label={article.title}>
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              loading={imagePriority ? "eager" : "lazy"}
            />
          </Link>
        ) : (
          <Link className="compact-image-wrap image-placeholder" to={`/story/${article.slug}`} aria-label={article.title}>
            <span>MR</span>
          </Link>
        )}
        <div className="compact-copy">
          <div className="card-kicker-row">
            <Link className="category-label" to={`/category/${categorySlug}`}>
              {categoryName}
            </Link>
            {article.isBreaking && <span className="breaking-badge">BREAKING</span>}
            {article.isSponsored && <span className="sponsored-label">SPONSORED</span>}
          </div>
          <h3 className="compact-headline">
            <Link to={`/story/${article.slug}`}>{article.title}</Link>
          </h3>
          <div className="story-byline">
            <span>{timeAgo(article.publishAt)}</span>
            {article.readingTime && <span>· {article.readingTime}m read</span>}
          </div>
        </div>
      </article>
    );
  }

  // Variant: Standard / Grid Card
  return (
    <article className={`story-card ${variant === "secondary" ? "story-card-secondary" : ""}`}>
      {article.imageUrl ? (
        <Link className="story-image" to={`/story/${article.slug}`} aria-label={article.title}>
          <img
            src={article.imageUrl}
            alt={article.imageAlt || article.title}
            loading={imagePriority ? "eager" : "lazy"}
          />
          {article.isBreaking && <span className="image-overlay-badge">BREAKING</span>}
        </Link>
      ) : (
        <Link className="story-image image-placeholder" to={`/story/${article.slug}`} aria-label={article.title}>
          <span>THE MERIDIAN RECORD</span>
        </Link>
      )}

      <div className="story-copy">
        <div className="card-kicker-row">
          <Link className="category-label" to={`/category/${categorySlug}`}>
            {categoryName}
          </Link>
          {article.isSponsored && <span className="sponsored-label">SPONSORED</span>}
          {article.isOpinion && <span className="opinion-label">OPINION</span>}
          <span className="card-timestamp">{timeAgo(article.publishAt)}</span>
        </div>

        <h3 className="story-headline">
          <Link to={`/story/${article.slug}`}>{article.title}</Link>
        </h3>

        {showSummary && article.summary && (
          <p className="story-summary">{article.summary}</p>
        )}

        <div className="story-byline">
          <span>By <strong>{article.author}</strong></span>
          {article.readingTime && <span>{article.readingTime} min read</span>}
        </div>
      </div>
    </article>
  );
}
