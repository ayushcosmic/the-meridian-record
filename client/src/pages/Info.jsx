import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const pagesData = {
  about: {
    title: "About The Meridian Record",
    subtitle: "Independent Reporting. Factual Context. Global Analysis.",
    body: (
      <>
        <p className="lead-paragraph">
          The Meridian Record is an independent digital news organization established to provide clear-eyed,
          uncompromising reporting on geopolitics, national governance, military strategy, macroeconomic markets, and technological transformation.
        </p>
        <h2>Our Editorial Philosophy</h2>
        <p>
          In an era of sensationalist soundbites and algorithmic polarization, The Meridian Record adheres to the classical
          tradition of verified journalism. We prioritize primary source documentation, verified eyewitness testimony,
          and domain expertise over viral speculation.
        </p>
        <h2>The Masthead</h2>
        <p>
          Our newsroom operates under a unified editorial board committed to factual rigor. Coverage is organized into specialized desks:
        </p>
        <ul>
          <li><strong>Geopolitical &amp; Defence Desk:</strong> Analyzing strategic competition, military deterrence, maritime security, and diplomatic treaties.</li>
          <li><strong>National &amp; Governance Desk:</strong> Covering policy debates, parliamentary legislation, democratic institutions, and regional affairs.</li>
          <li><strong>Financial &amp; Markets Desk:</strong> Tracking sovereign debt, energy transit, semiconductor fabrication, and monetary policy.</li>
          <li><strong>Science &amp; Culture Desk:</strong> Explaining aerospace exploration, quantum research, epidemiological developments, and cinema heritage.</li>
        </ul>
        <h2>Editorial Independence</h2>
        <p>
          The Meridian Record is free from external political or corporate control. Commercial advertising and sponsored initiatives are
          strictly insulated from newsroom editorial decisions.
        </p>
      </>
    )
  },

  "editorial-policy": {
    title: "Editorial Standards & Ethics Policy",
    subtitle: "Our Commitment to Verification, Sourcing, and Fairness",
    body: (
      <>
        <p className="lead-paragraph">
          The Meridian Record holds itself to the highest professional standards of journalistic integrity.
          Our newsroom operates under explicit ethical guidelines that guide every published article.
        </p>
        <h2>1. Verification and Sourcing Standards</h2>
        <p>
          We require multi-source verification for all factual assertions. Where single-source reporting occurs, the source’s
          credentials, access, and potential conflicts of interest are clearly contextualized. We link directly to official
          government white papers, legal transcripts, scientific datasets, and corporate filings whenever possible.
        </p>
        <h2>2. Anonymous Sources</h2>
        <p>
          Anonymous sourcing is permitted only when an individual faces demonstrable personal, legal, or professional retribution
          for disclosing matters of vital public interest. Information from unnamed sources must be corroborated by corroborating
          documents or second independent sources.
        </p>
        <h2>3. Separation of News and Opinion</h2>
        <p>
          Commentary, op-eds, and columns are visually and textually demarcated with clear "OPINION" badges. Editorial opinions
          reflect the viewpoints of the signed authors and do not represent factual news reporting.
        </p>
        <h2>4. Conflicts of Interest</h2>
        <p>
          Journalists and editors are prohibited from holding direct financial interests, advisory positions, or partisan political
          affiliations in organizations or sectors they actively cover. Any inadvertent conflict must be disclosed to senior editors.
        </p>
        <h2>5. Artificial Intelligence and Content Integrity</h2>
        <p>
          We do not publish unverified AI-generated text or fabricated imagery. Generative models may be used for internal research
          and code infrastructure, but every published sentence is reviewed, fact-checked, and approved by human editors.
        </p>
      </>
    )
  },

  "corrections-policy": {
    title: "Corrections & Retractions Policy",
    subtitle: "Transparent Accountability When Errors Occur",
    body: (
      <>
        <p className="lead-paragraph">
          The Meridian Record believes that prompt, transparent correction of factual errors is fundamental to preserving reader trust.
        </p>
        <h2>How We Handle Corrections</h2>
        <p>
          When an article is found to contain a factual inaccuracy:
        </p>
        <ol>
          <li>The text of the article is corrected immediately by the editorial desk.</li>
          <li>
            A formal <strong>Correction Notice</strong> is appended prominently at the top or bottom of the article, detailing:
            <ul>
              <li>The exact date and time the correction was published.</li>
              <li>The specific erroneous statement that was originally published.</li>
              <li>The corrected factual information.</li>
            </ul>
          </li>
          <li>We do not "stealth edit" or alter factual claims without logging a public correction.</li>
        </ol>
        <h2>Retractions</h2>
        <p>
          In rare circumstances where an article’s core premise is found to be false or materially compromised, the piece is formally
          retracted. An explanation from the Editor-in-Chief will replace the article text, explaining why the retraction was issued.
        </p>
        <h2>How Readers Can Request a Correction</h2>
        <p>
          If you believe a published story contains a factual error, please email our standards editor at{" "}
          <a href="mailto:corrections@meridianrecord.com">corrections@meridianrecord.com</a> with the story headline, URL, and verifiable evidence.
          All correction requests are reviewed within 24 hours.
        </p>
      </>
    )
  },

  privacy: {
    title: "Privacy Notice & Cookie Policy",
    subtitle: "How We Protect and Handle Reader Information",
    body: (
      <>
        <p className="lead-paragraph">
          The Meridian Record is committed to protecting your privacy. This policy outlines how information is collected,
          used, and safeguarded across our digital platform.
        </p>
        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Voluntary Newsletter Subscriptions:</strong> When you subscribe to our briefings, we collect your email address with explicit affirmative consent. You may unsubscribe at any time.</li>
          <li><strong>Standard Server Logs:</strong> To maintain system security and combat distributed denial-of-service attacks, our web servers log IP addresses, browser types, referring pages, and access timestamps. These logs are stored securely and never sold to third parties.</li>
          <li><strong>Administrative Cookies:</strong> Authenticated sessions for newsroom administrators utilize secure, HttpOnly, SameSite cookies to protect editorial functions.</li>
        </ul>
        <h2>2. Advertising and Google AdSense</h2>
        <p>
          We partner with third-party vendors, including Google, to serve advertisements on our website. Google uses cookies,
          including the DoubleClick cookie, to serve ads based on prior visits to our site or other websites on the internet.
          Readers may opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ad Settings
          </a>.
        </p>
        <h2>3. Data Protection Rights</h2>
        <p>
          Depending on your jurisdiction (including GDPR, CCPA, and India DPDP regulations), you hold the right to request access,
          rectification, or erasure of your personal data. To exercise these rights, contact our Data Protection Officer at{" "}
          <a href="mailto:privacy@meridianrecord.com">privacy@meridianrecord.com</a>.
        </p>
      </>
    )
  },

  terms: {
    title: "Terms of Service",
    subtitle: "Usage Guidelines for The Meridian Record",
    body: (
      <>
        <p className="lead-paragraph">
          By accessing The Meridian Record, you agree to comply with the following Terms of Service.
        </p>
        <h2>1. Intellectual Property &amp; Permitted Use</h2>
        <p>
          All articles, headlines, graphics, code, and multimedia published on The Meridian Record are the property of The Meridian Record
          or its licensed content partners, protected by international copyright laws. You may quote brief excerpts with clear attribution
          and a direct hyperlink to the original article. Wholesale reproduction, automated scraping, or commercial republishing without
          written consent is strictly prohibited.
        </p>
        <h2>2. Acceptable Conduct</h2>
        <p>
          Visitors agree not to probe, scan, or test the vulnerability of the system, inject malicious scripts, attempt unauthorized
          access to admin endpoints, or disrupt publication availability.
        </p>
        <h2>3. Disclaimer of Warranties</h2>
        <p>
          Editorial reporting is provided in good faith. The Meridian Record does not provide individual financial, legal, or investment advice.
        </p>
      </>
    )
  },

  contact: {
    title: "Contact The Newsroom",
    subtitle: "Inquiries, Confidential Tips & Editorial Letters",
    body: (
      <>
        <p className="lead-paragraph">
          The Meridian Record welcomes reader correspondence, news tips, and factual inquiries.
        </p>
        <div className="contact-desks-grid">
          <div className="contact-desk-card">
            <h3>General Editorial Inquiries</h3>
            <p>For questions regarding published coverage or general editorial matters:</p>
            <a href="mailto:editorial@meridianrecord.com" className="contact-link">editorial@meridianrecord.com</a>
          </div>

          <div className="contact-desk-card">
            <h3>Confidential Tips &amp; Whistleblower Desk</h3>
            <p>To submit sensitive documents or news tips with journalistic confidentiality:</p>
            <a href="mailto:tips@meridianrecord.com" className="contact-link">tips@meridianrecord.com</a>
            <small>PGP public key available upon verified request.</small>
          </div>

          <div className="contact-desk-card">
            <h3>Corrections &amp; Standards</h3>
            <p>To report a factual inaccuracy in a published story:</p>
            <a href="mailto:corrections@meridianrecord.com" className="contact-link">corrections@meridianrecord.com</a>
          </div>

          <div className="contact-desk-card">
            <h3>Advertising &amp; Sponsorships</h3>
            <p>For commercial partnership opportunities and programmatic inquiries:</p>
            <a href="mailto:partnerships@meridianrecord.com" className="contact-link">partnerships@meridianrecord.com</a>
          </div>
        </div>
      </>
    )
  },

  advertise: {
    title: "Advertise With The Meridian Record",
    subtitle: "High-Impact, Brand-Safe Sponsorships for Global Decision-Makers",
    body: (
      <>
        <p className="lead-paragraph">
          The Meridian Record connects premium brands with a highly engaged audience of foreign policy professionals,
          defense analysts, corporate leaders, technologists, and public policy researchers.
        </p>
        <h2>Available Placements</h2>
        <ul>
          <li><strong>Desktop Leaderboard (728 × 90):</strong> Premium positioning below the masthead across all desktop article pages.</li>
          <li><strong>Mobile Header Banner (320 × 50):</strong> High-visibility placement on mobile devices.</li>
          <li><strong>Sidebar Half-Page &amp; Medium Rectangle (300 × 600 / 300 × 250):</strong> High viewability accompanying long-form investigations.</li>
          <li><strong>In-Article Stream Placement:</strong> Contextual ad slots appearing after paragraph blocks in long-form investigative reporting.</li>
          <li><strong>The Morning Dispatch Newsletter Sponsorship:</strong> Direct delivery to over 45,000 verified daily subscribers.</li>
        </ul>
        <h2>Google AdSense &amp; Programmatic Compliance</h2>
        <p>
          We maintain strict adherence to Google AdSense program policies and Coalition for Better Ads standards. We reject intrusive
          pop-ups, deceptive click-jacking, auto-playing video with sound, and unlabelled promotional content.
        </p>
        <h2>Native &amp; Sponsored Reporting Standards</h2>
        <p>
          All sponsored features are subject to editorial review and must be clearly disclosed with prominent "SPONSORED" badges
          and explanatory partner disclaimers.
        </p>
        <p>
          To request our comprehensive media kit, contact{" "}
          <a href="mailto:partnerships@meridianrecord.com">partnerships@meridianrecord.com</a>.
        </p>
      </>
    )
  }
};

export default function Info() {
  const { page } = useParams();
  const info = pagesData[page];

  if (!info) {
    return (
      <main className="container page-content info-page-wrap error-404-page">
        <Helmet>
          <title>404 Page Not Found | The Meridian Record</title>
        </Helmet>
        <div className="not-found-card">
          <span className="error-code">404</span>
          <span className="section-flag">PAGE NOT FOUND</span>
          <h1>We Couldn’t Locate That Headline.</h1>
          <p>
            The article, section, or document you requested may have been archived, moved, or is temporarily unavailable.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="button">
              ← Return to Front Page
            </Link>
            <Link to="/search" className="button button-outline">
              Search the News Archive
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container page-content info-page-wrap">
      <Helmet>
        <title>{info.title} | The Meridian Record</title>
        <meta name="description" content={info.subtitle} />
      </Helmet>

      <nav className="article-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{info.title}</span>
      </nav>

      <div className="info-header-block">
        <span className="section-flag">EDITORIAL TRUST &amp; TRANSPARENCY</span>
        <h1 className="info-page-title">{info.title}</h1>
        <p className="info-page-subtitle">{info.subtitle}</p>
      </div>

      <div className="info-prose-content">
        {info.body}
      </div>

      <div className="info-footer-link">
        <Link to="/" className="button button-outline">
          ← Return to The Meridian Record Front Page
        </Link>
      </div>
    </main>
  );
}
