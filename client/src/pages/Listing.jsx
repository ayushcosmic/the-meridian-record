import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "../lib/api";
import StoryCard from "../components/StoryCard";
import AdSlot from "../components/AdSlot";
import { EmptyState, ErrorState, SkeletonCard } from "../components/States";

export default function Listing() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const sort = params.get("sort") || "latest";
  const opinionOnly = params.get("opinion") === "true";
  const currentPage = Math.max(1, Number.parseInt(params.get("page") || "1", 10));

  const [payload, setPayload] = useState(null);
  const [allArticles, setAllArticles] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  async function loadData(reset = true) {
    if (reset) {
      setLoading(true);
      setError("");
      setAllArticles([]);
    } else {
      setLoadingMore(true);
    }

    const searchParams = new URLSearchParams({
      page: String(currentPage),
      limit: "12"
    });

    if (slug) searchParams.set("category", slug);
    if (query) searchParams.set("q", query);
    if (sort) searchParams.set("sort", sort);
    if (opinionOnly) searchParams.set("opinion", "true");

    try {
      const data = await api(`/articles?${searchParams}`);
      setPayload(data);
      if (reset) {
        setAllArticles(data.articles || []);
      } else {
        setAllArticles(prev => [...prev, ...(data.articles || [])]);
      }

      if (slug) {
        const catRes = await api("/categories");
        const found = catRes.categories?.find((c) => c.slug === slug);
        setCategoryInfo(found || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadData(true);
  }, [slug, query, sort, opinionOnly]);

  // When page changes via pagination (not load more), reset
  useEffect(() => {
    if (currentPage > 1) loadData(false);
  }, [currentPage]);

  const categoryName = categoryInfo?.name || (slug ? slug.replace(/-/g, " ").toUpperCase() : "");
  const pageTitle = query ? `Search: "${query}"` : slug ? `${categoryName} News & Analysis` : "All Newsroom Articles";

  function setSort(newSort) {
    setParams((prev) => {
      prev.set("sort", newSort);
      prev.set("page", "1");
      return prev;
    });
  }

  function toggleOpinion() {
    setParams((prev) => {
      if (opinionOnly) {
        prev.delete("opinion");
      } else {
        prev.set("opinion", "true");
      }
      prev.set("page", "1");
      return prev;
    });
  }

  function loadMore() {
    setParams((prev) => {
      prev.set("page", String(currentPage + 1));
      return prev;
    });
  }

  // Ellipsis pagination helper
  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  }

  const hasMore = payload && payload.page < payload.pages;

  return (
    <main className="container page-content listing-page-wrap">
      <Helmet>
        <title>{pageTitle} | The Meridian Record</title>
        <meta
          name="description"
          content={categoryInfo?.description || `Authoritative reporting and coverage from The Meridian Record.`}
        />
      </Helmet>

      {/* Breadcrumb Navigation */}
      <nav className="article-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">›</span>
        {slug ? (
          <span aria-current="page">{categoryName}</span>
        ) : query ? (
          <span aria-current="page">Search</span>
        ) : (
          <span aria-current="page">Articles</span>
        )}
      </nav>

      {/* Listing Masthead */}
      <div className="listing-header-block">
        <div className="listing-header-text">
          <span className="section-flag">
            {query ? "SEARCH ARCHIVE" : slug ? "DESK COVERAGE" : "ALL REPORTING"}
          </span>
          <h1 className="page-title">{pageTitle}</h1>
          {categoryInfo?.description && (
            <p className="category-deck">{categoryInfo.description}</p>
          )}
        </div>

        {/* Filters and Sorting Controls */}
        <div className="listing-controls-bar">
          <div className="sort-buttons-group">
            <span className="control-label">SORT BY:</span>
            <button
              type="button"
              className={`sort-pill ${sort === "latest" ? "active-sort" : ""}`}
              onClick={() => setSort("latest")}
            >
              Latest
            </button>
            <button
              type="button"
              className={`sort-pill ${sort === "popular" ? "active-sort" : ""}`}
              onClick={() => setSort("popular")}
            >
              Most Read
            </button>
            <button
              type="button"
              className={`sort-pill ${sort === "featured" ? "active-sort" : ""}`}
              onClick={() => setSort("featured")}
            >
              Featured
            </button>
          </div>

          <div className="filter-toggle-group">
            <button
              type="button"
              className={`filter-pill ${opinionOnly ? "active-filter" : ""}`}
              onClick={toggleOpinion}
            >
              {opinionOnly ? "✓ Opinion Columns Only" : "Opinion Columns"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} retry={() => loadData(true)} />
      ) : loading ? (
        <div className="story-grid story-grid-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : allArticles.length > 0 ? (
        <>
          <div className="story-grid story-grid-3">
            {allArticles.map((article) => (
              <StoryCard key={article._id} article={article} />
            ))}
          </div>

          {/* Listing In-Feed AdSlot */}
          <div className="listing-ad-banner">
            <AdSlot slotType="leaderboard" />
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="load-more-wrap">
              <button
                className="load-more-btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                    Loading more stories...
                  </>
                ) : (
                  <>
                    Load More Stories
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Ellipsis Pagination — only show if not using load more flow */}
          {payload && payload.pages > 1 && !hasMore && (
            <nav className="pagination-bar" aria-label="Pagination">
              <button
                className="page-nav-btn"
                disabled={currentPage <= 1}
                onClick={() => { setParams(p => { p.set("page", String(currentPage - 1)); return p; }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                ← Prev
              </button>

              <div className="page-numbers-list">
                {getPageNumbers(currentPage, payload.pages).map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`page-num-btn ${p === currentPage ? "active-page" : ""}`}
                      onClick={() => { setParams(prev => { prev.set("page", String(p)); return prev; }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                className="page-nav-btn"
                disabled={currentPage >= payload.pages}
                onClick={() => { setParams(p => { p.set("page", String(currentPage + 1)); return p; }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState>
          {query
            ? `No published articles matched "${query}". Please check your spelling or search across all categories.`
            : `No published articles in this section yet.`}
        </EmptyState>
      )}
    </main>
  );
}
