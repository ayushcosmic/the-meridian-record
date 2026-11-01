import { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const defaultCategories = [
  { name: "World", slug: "world" },
  { name: "India", slug: "india" },
  { name: "Politics", slug: "politics" },
  { name: "Geopolitics", slug: "geopolitics" },
  { name: "Business", slug: "business" },
  { name: "Technology", slug: "technology" },
  { name: "Defence", slug: "defence" },
  { name: "Science", slug: "science" },
  { name: "Opinion", slug: "opinion" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Sports", slug: "sports" }
];

export default function Header() {
  const [categories, setCategories] = useState(defaultCategories);
  const [breaking, setBreaking] = useState([]);
  const [settings, setSettings] = useState(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('meridian_dark') === '1'; } catch { return false; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Format date in editorial format
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(now);
    setCurrentDate(formatted);

    // Fetch categories, breaking stories, and public settings
    api("/categories")
      .then((data) => {
        if (data.categories?.length) {
          // Sort according to order
          const sorted = [...data.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
          setCategories(sorted);
        }
      })
      .catch((err) => console.debug("Categories:", err.message));

    api("/articles/breaking")
      .then((data) => setBreaking(Array.isArray(data?.articles) ? data.articles : []))
      .catch((err) => console.debug("Breaking:", err.message));

    api("/settings/public")
      .then((data) => setSettings(data?.settings || null))
      .catch((err) => console.debug("Settings:", err.message));
  }, []);

  // Cycle breaking news headlines every 5 seconds if not paused
  useEffect(() => {
    if (!breaking.length || tickerPaused) return;
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % breaking.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [breaking.length, tickerPaused]);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Dark mode persistence
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      try { localStorage.setItem('meridian_dark', '1'); } catch {}
    } else {
      document.documentElement.classList.remove('dark-mode');
      try { localStorage.setItem('meridian_dark', '0'); } catch {}
    }
  }, [darkMode]);

  // Keyboard shortcut '/' to open search
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  }

  const activeBreaking = breaking[tickerIndex];

  return (
    <header className="site-header">
      {/* 1. Super-Header Utility Bar */}
      <div className="top-utility-bar">
        <div className="container utility-inner">
          <div className="utility-left">
            <span className="current-dateline">{currentDate}</span>
            <span className="utility-divider">|</span>
            <span className="edition-badge">GLOBAL EDITION</span>
          </div>
          <div className="utility-right">
          </div>
        </div>
      </div>

      {/* 2. Admin-Controlled Breaking News Ticker */}
      {(settings?.breakingBannerActive || breaking.length > 0) && (
        <div className="breaking-ticker-bar" role="region" aria-label="Breaking news ticker">
          <div className="container ticker-container">
            <div className="ticker-badge-wrap">
              <span className="ticker-pulse-dot" aria-hidden="true" />
              <strong className="ticker-label">BREAKING NEWS</strong>
            </div>

            <div
              className="ticker-content"
              onMouseEnter={() => setTickerPaused(true)}
              onMouseLeave={() => setTickerPaused(false)}
            >
              {settings?.breakingBannerActive && settings.breakingBannerText ? (
                <div className="ticker-headline active-headline">
                  {settings.breakingBannerUrl ? (
                    <a href={settings.breakingBannerUrl}>{settings.breakingBannerText}</a>
                  ) : (
                    <span>{settings.breakingBannerText}</span>
                  )}
                </div>
              ) : activeBreaking ? (
                <div className="ticker-headline active-headline">
                  <Link to={`/story/${activeBreaking.slug}`}>
                    <span className="ticker-headline-cat">{activeBreaking.category?.name}:</span>{" "}
                    {activeBreaking.title}
                  </Link>
                </div>
              ) : (
                <div className="ticker-headline">
                  <span>Continuous geopolitical, security, and financial reporting from The Meridian Record newsroom.</span>
                </div>
              )}
            </div>

            {breaking.length > 1 && (
              <div className="ticker-controls">
                <button
                  type="button"
                  className="ticker-btn"
                  onClick={() => setTickerIndex((prev) => (prev - 1 + breaking.length) % breaking.length)}
                  aria-label="Previous breaking headline"
                >
                  ‹
                </button>
                <span className="ticker-count">
                  {tickerIndex + 1}/{breaking.length}
                </span>
                <button
                  type="button"
                  className="ticker-btn"
                  onClick={() => setTickerIndex((prev) => (prev + 1) % breaking.length)}
                  aria-label="Next breaking headline"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="ticker-btn ticker-pause-btn"
                  onClick={() => setTickerPaused((p) => !p)}
                  aria-label={tickerPaused ? "Resume ticker" : "Pause ticker"}
                  title={tickerPaused ? "Resume ticker" : "Pause ticker"}
                >
                  {tickerPaused ? "▶" : "⏸"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Grand Editorial Masthead */}
      <div className="masthead-section">
        <div className="container masthead-inner">
          <div className="masthead-left">
            <button
              className="mobile-menu-trigger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close section navigation" : "Open section navigation"}
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
            >
              <span className="hamburger-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="menu-btn-text">SECTIONS</span>
            </button>
          </div>

          <div className="masthead-center">
            <Link to="/" className="publication-brand" aria-label="The Meridian Record homepage">
              <div className="brand-crest" aria-hidden="true">
                <span className="crest-initials">MR</span>
              </div>
              <div className="brand-titles">
                <span className="brand-super">THE</span>
                <h1 className="brand-name">MERIDIAN RECORD</h1>
                <span className="brand-sub">INDEPENDENT JOURNALISM · GLOBAL PERSPECTIVE · EST. 2026</span>
              </div>
            </Link>
          </div>

          <div className="masthead-right">
            <button
              type="button"
              className="dark-mode-toggle"
              onClick={() => setDarkMode(d => !d)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? '☀' : '🌙'}
            </button>
            <form className="masthead-search-form" onSubmit={handleSearchSubmit}>
              <label htmlFor="search-input" className="sr-only">
                Search published articles
              </label>
              <input
                id="search-input"
                ref={searchInputRef}
                type="search"
                placeholder="Search stories... (press /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" aria-label="Execute search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 4. Primary Sticky Navigation Bar */}
      <nav
        id="main-navigation"
        className={`primary-navigation-bar ${menuOpen ? "mobile-drawer-open" : ""}`}
        aria-label="Primary news sections"
      >
        <div className="container nav-content-wrap">
          <div className="nav-items-list">
            <NavLink end to="/" className="nav-link home-nav-link">
              HOME
            </NavLink>
            {categories.map((cat) => (
              <NavLink
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={({ isActive }) => `nav-link ${isActive ? "active-nav" : ""}`}
              >
                {cat.name.toUpperCase()}
              </NavLink>
            ))}
          </div>

          {/* Mobile search bar inside drawer */}
          <div className="mobile-drawer-search">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="search"
                placeholder="Search across all categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="button">Search</button>
            </form>
          </div>
        </div>
      </nav>
    </header>
  );
}
