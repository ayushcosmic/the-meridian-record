import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="publication-footer" role="contentinfo">
      {/* Top Footer Banner */}
      <div className="footer-top-strip">
        <div className="container footer-strip-inner">
          <div className="footer-brand-lockup">
            <div className="footer-crest" aria-hidden="true">MR</div>
            <div className="footer-titles">
              <span className="footer-title-main">THE MERIDIAN RECORD</span>
              <span className="footer-title-sub">AN INDEPENDENT DIGITAL NEWS PUBLICATION</span>
            </div>
          </div>
          <div className="footer-newsletter-shortcut">
            <span className="shortcut-text">Receive our daily morning dispatch:</span>
            <a href="#newsletter-signup" className="button button-outline footer-btn">
              Subscribe to Briefing
            </a>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Directory */}
      <div className="container footer-main-grid">
        {/* Col 1: Mission and Trust */}
        <div className="footer-col footer-col-about">
          <h3>EDITORIAL MISSION</h3>
          <p className="footer-desc">
            The Meridian Record is an independent digital news organization dedicated to verified,
            in-depth reporting and clear-eyed geopolitical, defense, economic, and technological analysis.
            We operate under strict factual verification and editorial integrity principles.
          </p>
          <div className="trust-cert-badges">
            <span className="trust-pill">✓ Independent Reporting</span>
            <span className="trust-pill">✓ Verified Sources</span>
            <span className="trust-pill">✓ Transparent Corrections</span>
          </div>
        </div>

        {/* Col 2: News Sections */}
        <div className="footer-col">
          <h3>NEWS SECTIONS</h3>
          <ul className="footer-nav-list">
            <li><Link to="/category/world">World Affairs</Link></li>
            <li><Link to="/category/india">India & Governance</Link></li>
            <li><Link to="/category/politics">Politics & Policy</Link></li>
            <li><Link to="/category/geopolitics">Geopolitics & Strategy</Link></li>
            <li><Link to="/category/business">Business & Markets</Link></li>
            <li><Link to="/category/technology">Technology & AI</Link></li>
            <li><Link to="/category/defence">Defence & Security</Link></li>
            <li><Link to="/category/science">Science & Discovery</Link></li>
            <li><Link to="/category/opinion">Editorial & Opinion</Link></li>
            <li><Link to="/category/entertainment">Arts & Culture</Link></li>
            <li><Link to="/category/sports">Sports</Link></li>
          </ul>
        </div>

        {/* Col 3: Standards & Newsroom */}
        <div className="footer-col">
          <h3>STANDARDS &amp; POLICIES</h3>
          <ul className="footer-nav-list">
            <li><Link to="/about">About the Newsroom</Link></li>
            <li><Link to="/editorial-policy">Editorial Standards &amp; Ethics</Link></li>
            <li><Link to="/corrections-policy">Corrections &amp; Retractions</Link></li>
            <li><Link to="/contact">Contact the Newsroom</Link></li>
            <li><Link to="/contact">Submit a Confidential Tip</Link></li>
            <li><Link to="/advertise">Advertise with The Meridian Record</Link></li>
            <li><Link to="/admin">Newsroom Admin Portal</Link></li>
          </ul>
        </div>

        {/* Col 4: Legal & Subscriptions */}
        <div className="footer-col">
          <h3>LEGAL &amp; DISCOVERY</h3>
          <ul className="footer-nav-list">
            <li><Link to="/privacy">Privacy Notice</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">XML Sitemap</a></li>
            <li><a href="/news-sitemap.xml" target="_blank" rel="noopener noreferrer">Google News Sitemap</a></li>
            <li><a href="/feed.xml" target="_blank" rel="noopener noreferrer">RSS 2.0 Newsfeed</a></li>
            <li><a href="/robots.txt" target="_blank" rel="noopener noreferrer">Robots Protocol</a></li>
          </ul>
          <div className="footer-monetization-disclosure">
            <small>
              Monetization Notice: Advertisements and sponsored reporting are strictly separated from independent editorial newsroom operations.
            </small>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="container bottom-inner">
          <p>© {currentYear} The Meridian Record. All rights reserved. Original journalism protected by copyright.</p>
          <div className="bottom-links">
            <span>Powered by Secure Express &amp; React Architecture</span>
            <span className="footer-dot">·</span>
            <span>Audited Editorial Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
