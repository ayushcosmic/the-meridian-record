import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "../lib/api";
import StoryCard from "../components/StoryCard";
import AdSlot from "../components/AdSlot";
import Newsletter from "../components/Newsletter";
import { EmptyState, ErrorState, SkeletonLead, SkeletonCard } from "../components/States";
import { timeAgo } from "../lib/format";

const normalizeArticles = (value) => (Array.isArray(value) ? value : []);

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heroPackage, setHeroPackage] = useState(null);
  const [popularStories, setPopularStories] = useState([]);
  const [categorySections, setCategorySections] = useState({});
  const [settings, setSettings] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        heroData,
        popularData,
        geopoliticsData,
        indiaData,
        defenceData,
        businessData,
        technologyData,
        opinionData,
        scienceData,
        entertainmentData,
        settingsData
      ] = await Promise.all([
        api("/articles/hero-package"),
        api("/articles/popular"),
        api("/articles?category=geopolitics&limit=4"),
        api("/articles?category=india&limit=4"),
        api("/articles?category=defence&limit=4"),
        api("/articles?category=business&limit=4"),
        api("/articles?category=technology&limit=4"),
        api("/articles/opinion"),
        api("/articles?category=science&limit=3"),
        api("/articles?category=entertainment&limit=3"),
        api("/settings/public").catch(() => ({ settings: null }))
      ]);

      setHeroPackage(heroData || {});
      setPopularStories(normalizeArticles(popularData?.articles));
      setCategorySections({
        geopolitics: normalizeArticles(geopoliticsData?.articles),
        india: normalizeArticles(indiaData?.articles),
        defence: normalizeArticles(defenceData?.articles),
        business: normalizeArticles(businessData?.articles),
        technology: normalizeArticles(technologyData?.articles),
        opinion: normalizeArticles(opinionData?.articles),
        science: normalizeArticles(scienceData?.articles),
        entertainment: normalizeArticles(entertainmentData?.articles)
      });
      setSettings(settingsData?.settings || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return (
      <main className="container page-content">
        <ErrorState error={error} retry={loadData} />
      </main>
    );
  }

  const lead = heroPackage?.leadStory;
  const secondary = heroPackage?.secondaryStories || [];
  const wire = heroPackage?.wireStories || [];
  const opinions = heroPackage?.opinionStories || [];

  return (
    <main className="home-page-wrap">
      <Helmet>
        <title>The Meridian Record | Independent News, Geopolitics &amp; Global Analysis</title>
        <meta
          name="description"
          content="Independent journalism, defense policy, geopolitics, Indian governance, economics, and technological transformation from The Meridian Record."
        />
        <meta property="og:title" content="The Meridian Record | Independent News &amp; Global Analysis" />
        <meta
          property="og:description"
          content="Independent journalism, defense policy, geopolitics, Indian governance, economics, and technological transformation."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="The Meridian Record | Independent News & Global Analysis" />
        <meta property="twitter:description" content="Independent journalism, defense policy, geopolitics, Indian governance, economics, and technological transformation." />
        <meta property="twitter:image" content="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80" />
      </Helmet>

      {/* Top Banner Advertisement */}
      <div className="container ad-leaderboard-wrap">
        <AdSlot
          slotType="leaderboard"
          clientId={settings?.adsenseClientId}
          slotId={settings?.adsenseHeaderSlot}
        />
      </div>

      <div className="container page-content">
        {loading ? (
          <div className="home-skeleton-wrap">
            <SkeletonLead />
            <div className="story-grid story-grid-3" style={{ marginTop: "30px" }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : !lead ? (
          <EmptyState>
            No articles published yet. Sign in to the newsroom admin dashboard to publish your first story or run the database seed script.
          </EmptyState>
        ) : (
          <>
            {/* 1. FRONT PAGE HERO PACKAGE (CNN / NY Post / Daily Mail 3-Column Layout) */}
            <section className="hero-editorial-package" aria-label="Lead news package">
              {/* Left Column: The Live News Wire */}
              <aside className="hero-wire-col">
                <div className="column-header wire-header">
                  <div className="wire-header-title">
                    <span className="live-pulse-dot" aria-hidden="true" />
                    <h2>THE NEWS WIRE</h2>
                  </div>
                  <span className="wire-badge">LIVE ALERTS</span>
                </div>

                <div className="wire-feed-list">
                  {wire.map((story) => (
                    <StoryCard key={story._id} article={story} variant="wire" />
                  ))}
                </div>

                <div className="wire-footer-link">
                  <Link to="/search?sort=latest">View all latest wire updates →</Link>
                </div>
              </aside>

              {/* Center Column: The Primary Lead Package */}
              <div className="hero-center-col">
                <article className="lead-story-card">
                  <Link to={`/story/${lead.slug}`} className="lead-image-frame">
                    {lead.imageUrl ? (
                      <img
                        src={lead.imageUrl}
                        alt={lead.imageAlt || lead.title}
                        fetchPriority="high"
                      />
                    ) : (
                      <div className="image-placeholder lead-placeholder">
                        <span>THE MERIDIAN RECORD</span>
                      </div>
                    )}
                    {lead.isBreaking && (
                      <div className="lead-breaking-ribbon">🚨 BREAKING INVESTIGATION</div>
                    )}
                  </Link>

                  <div className="lead-editorial-body">
                    <div className="lead-kicker-row">
                      <Link className="category-label" to={`/category/${lead.category?.slug}`}>
                        {lead.category?.name}
                      </Link>
                      {lead.isSponsored && <span className="sponsored-label">SPONSORED</span>}
                      <span className="card-timestamp">{timeAgo(lead.publishAt)}</span>
                    </div>

                    <h2 className="lead-headline">
                      <Link to={`/story/${lead.slug}`}>{lead.title}</Link>
                    </h2>

                    <p className="lead-deck">{lead.summary}</p>

                    <div className="lead-byline-bar">
                      <div className="author-info">
                        <span className="byline-author">By <strong>{lead.author}</strong></span>
                        <span className="byline-role">{lead.authorRole || "Senior Editor"}</span>
                      </div>
                      <div className="byline-timing">
                        {lead.readingTime && <span>{lead.readingTime} min read</span>}
                      </div>
                    </div>
                  </div>
                </article>

                {/* Secondary Doublet Stories below Lead */}
                {secondary.length > 0 && (
                  <div className="secondary-doublet-row">
                    {secondary.map((story) => (
                      <StoryCard key={story._id} article={story} variant="secondary" />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Trending, Opinions & Ad Rail */}
              <aside className="hero-right-col">
                {/* Most Read (Ranked #1 to #5) */}
                <div className="column-header">
                  <h2>MOST READ</h2>
                  <span className="rank-trend-icon">🔥</span>
                </div>

                <div className="most-read-list">
                  {popularStories.slice(0, 5).map((story, idx) => (
                    <StoryCard key={story._id} article={story} variant="ranked" rank={idx + 1} />
                  ))}
                </div>

                {/* Sidebar Rectangle Ad */}
                <div className="hero-rail-ad">
                  <AdSlot
                    slotType="rectangle"
                    clientId={settings?.adsenseClientId}
                    slotId={settings?.adsenseSidebarSlot}
                  />
                </div>

                {/* Opinion Voices Spotlight */}
                {opinions.length > 0 && (
                  <div className="opinion-spotlight-block">
                    <div className="column-header opinion-header">
                      <h2>OPINION &amp; ANALYSIS</h2>
                      <Link to="/category/opinion">All Columns →</Link>
                    </div>
                    {opinions.slice(0, 2).map((op) => (
                      <StoryCard key={op._id} article={op} variant="opinion" showSummary={false} />
                    ))}
                  </div>
                )}
              </aside>
            </section>

            {/* Mid-Page In-Feed Ad Placement */}
            <section className="infeed-ad-section">
              <AdSlot
                slotType="in-feed"
                clientId={settings?.adsenseClientId}
                slotId={settings?.adsenseHeaderSlot}
              />
            </section>

            {/* 2. DEFENCE & GEOPOLITICS SECTION (High density 4-card grid) */}
            <section className="news-block-section geopolitics-section">
              <div className="section-masthead-bar">
                <div className="section-title-lockup">
                  <span className="section-flag">STRATEGIC DESK</span>
                  <h2>DEFENCE &amp; GEOPOLITICS</h2>
                </div>
                <Link to="/category/geopolitics" className="section-more-link">
                  Explore Geopolitics Archive →
                </Link>
              </div>

              <div className="story-grid story-grid-4">
                {categorySections.geopolitics?.slice(0, 4).map((story) => (
                  <StoryCard key={story._id} article={story} />
                ))}
              </div>
            </section>

            {/* 3. INDIA & GOVERNANCE SECTION (Feature Card + 3 Compact List) */}
            <section className="news-block-section india-section">
              <div className="section-masthead-bar">
                <div className="section-title-lockup">
                  <span className="section-flag">NATIONAL DESK</span>
                  <h2>INDIA &amp; GOVERNANCE</h2>
                </div>
                <Link to="/category/india" className="section-more-link">
                  More India Coverage →
                </Link>
              </div>

              <div className="india-composite-layout">
                {categorySections.india?.[0] && (
                  <div className="india-feature-col">
                    <StoryCard article={categorySections.india[0]} showSummary />
                  </div>
                )}
                <div className="india-compact-col">
                  {categorySections.india?.slice(1, 4).map((story) => (
                    <StoryCard key={story._id} article={story} variant="compact" />
                  ))}
                </div>
              </div>
            </section>

            {/* 4. BUSINESS & GLOBAL MARKETS */}
            <section className="news-block-section business-section">
              <div className="section-masthead-bar">
                <div className="section-title-lockup">
                  <span className="section-flag">FINANCIAL RECORD</span>
                  <h2>BUSINESS &amp; MARKETS</h2>
                </div>
                <Link to="/category/business" className="section-more-link">
                  All Business News →
                </Link>
              </div>

              <div className="story-grid story-grid-3">
                {categorySections.business?.slice(0, 3).map((story) => (
                  <StoryCard key={story._id} article={story} />
                ))}
              </div>
            </section>

            {/* 5. TECHNOLOGY & INNOVATION */}
            <section className="news-block-section tech-section">
              <div className="section-masthead-bar">
                <div className="section-title-lockup">
                  <span className="section-flag">FUTURE DESK</span>
                  <h2>TECHNOLOGY &amp; SCIENCE</h2>
                </div>
                <Link to="/category/technology" className="section-more-link">
                  All Tech &amp; Science →
                </Link>
              </div>

              <div className="story-grid story-grid-3">
                {categorySections.technology?.slice(0, 3).map((story) => (
                  <StoryCard key={story._id} article={story} />
                ))}
              </div>
            </section>

            {/* 6. OPINION & COMMENTARY (Classic Newsprint Sepia Deck) */}
            {categorySections.opinion?.length > 0 && (
              <section className="news-block-section opinion-broadsheet-section">
                <div className="section-masthead-bar">
                  <div className="section-title-lockup">
                    <span className="section-flag">EDITORIAL BOARD</span>
                    <h2>OPINION, COLUMNS &amp; ESSAYS</h2>
                  </div>
                  <Link to="/category/opinion" className="section-more-link">
                    Read All Columnists →
                  </Link>
                </div>

                <div className="opinion-cards-grid">
                  {categorySections.opinion.slice(0, 4).map((story) => (
                    <StoryCard key={story._id} article={story} variant="opinion" />
                  ))}
                </div>
              </section>
            )}

            {/* 7. SCIENCE, ARTS & CULTURE */}
            <section className="news-block-section culture-section">
              <div className="section-masthead-bar">
                <div className="section-title-lockup">
                  <span className="section-flag">CULTURE &amp; DISCOVERY</span>
                  <h2>ARTS, ENTERTAINMENT &amp; SCIENCE</h2>
                </div>
              </div>

              <div className="story-grid story-grid-3">
                {[
                  ...(categorySections.science?.slice(0, 1) || []),
                  ...(categorySections.entertainment?.slice(0, 2) || [])
                ].map((story) => (
                  <StoryCard key={story._id} article={story} />
                ))}
              </div>
            </section>

            {/* Newsletter Subscription Card */}
            <Newsletter />
          </>
        )}
      </div>
    </main>
  );
}
