import { useState } from "react";
import { Link } from "react-router-dom";
import { api, jsonBody } from "../lib/api";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setIsSuccess(false);

    try {
      const result = await api("/newsletter", {
        method: "POST",
        body: jsonBody({ email, consent })
      });
      setIsSuccess(true);
      setStatus(result.message || "Thank you for subscribing to The Meridian Morning Dispatch.");
      setEmail("");
      setConsent(false);
    } catch (error) {
      setIsSuccess(false);
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="newsletter-section" id="newsletter-signup" aria-labelledby="newsletter-heading">
      <div className="newsletter-card">
        <div className="newsletter-copy">
          <span className="newsletter-eyebrow">THE MORNING DISPATCH</span>
          <h2 id="newsletter-heading">Independent Reporting, Delivered to Your Inbox.</h2>
          <p>
            Start your day with essential context on world affairs, security, economics, and technological transformation.
            Curated daily by senior editors. No spam, ever.
          </p>
        </div>

        <form className="newsletter-form" onSubmit={submit}>
          <div className="newsletter-input-group">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your professional email address..."
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button className="button newsletter-submit-btn" disabled={busy}>
              {busy ? "Subscribing…" : "Join 45,000+ Readers"}
            </button>
          </div>

          <label className="newsletter-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            <span>
              I agree to receive editorial newsletters and accept the{" "}
              <Link to="/privacy">Privacy Notice</Link>. You can unsubscribe at any time.
            </span>
          </label>

          {status && (
            <div
              className={`newsletter-alert ${isSuccess ? "alert-success" : "alert-error"}`}
              role={isSuccess ? "status" : "alert"}
            >
              {status}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
