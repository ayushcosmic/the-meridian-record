export function Loading({ label = "Loading stories" }) {
  return (
    <div className="state-card loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-image" />
      <div className="skeleton-copy">
        <div className="skeleton-line skeleton-meta" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-title" style={{ width: "80%" }} />
        <div className="skeleton-line skeleton-deck" />
        <div className="skeleton-line skeleton-byline" />
      </div>
    </div>
  );
}

export function SkeletonLead() {
  return (
    <div className="skeleton-lead" aria-hidden="true">
      <div className="skeleton-lead-image" />
      <div className="skeleton-lead-copy">
        <div className="skeleton-line skeleton-meta" />
        <div className="skeleton-line skeleton-h1" />
        <div className="skeleton-line skeleton-h1" style={{ width: "90%" }} />
        <div className="skeleton-line skeleton-deck" />
        <div className="skeleton-line skeleton-deck" style={{ width: "70%" }} />
        <div className="skeleton-line skeleton-byline" />
      </div>
    </div>
  );
}

export function ErrorState({ error, retry }) {
  return (
    <div className="state-card error-state" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <div className="error-content">
        <strong>Editorial feed temporarily unavailable.</strong>
        <p>{error || "An unexpected error occurred while communicating with the newsroom."}</p>
        {retry && (
          <button className="button button-outline" onClick={retry}>
            Retry loading stories
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ children = "No stories found in this section." }) {
  return (
    <div className="state-card empty-state">
      <div className="empty-icon" aria-hidden="true">📰</div>
      <p>{children}</p>
    </div>
  );
}
