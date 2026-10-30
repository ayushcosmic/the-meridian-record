import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api, jsonBody } from "../lib/api";
import { formatDate, formatDateTime, titleToSlug } from "../lib/format";
import { ErrorState, Loading } from "../components/States";

const blankStory = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  author: "",
  authorRole: "Staff Correspondent",
  category: "",
  tags: "",
  imageUrl: "",
  imageAlt: "",
  imageCredit: "",
  status: "draft",
  publishAt: new Date(Date.now() + 60000).toISOString().slice(0, 16),
  isBreaking: false,
  breakingPriority: 0,
  isFeatured: false,
  isTrending: false,
  isOpinion: false,
  isSponsored: false,
  readingTime: 4,
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  focusKeywords: "",
  corrections: []
};

function toLocalDateTime(value) {
  if (!value) return new Date().toISOString().slice(0, 16);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 16);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Active navigation tab: stories, editor, breaking, categories, monetization, audience, security
  const [activeTab, setActiveTab] = useState("stories");

  // Dashboard state
  const [overview, setOverview] = useState(null);
  const [articles, setArticles] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [settingsForm, setSettingsForm] = useState(null);

  // Editor state
  const [form, setForm] = useState(blankStory);
  const [editingId, setEditingId] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [previewModalStory, setPreviewModalStory] = useState(null);
  const [correctionText, setCorrectionText] = useState("");

  // Category editing state
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "", order: 0 });
  const [categoryEditingId, setCategoryEditingId] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function refreshData() {
    try {
      const [stats, articleData, categoryData, subscriberData, settingsData] = await Promise.all([
        api("/admin/overview"),
        api("/admin/articles"),
        api("/admin/categories"),
        api("/admin/subscribers"),
        api("/settings/admin").catch(() => ({ settings: null }))
      ]);

      setOverview(stats);
      setArticles(articleData.articles || []);
      setCategories(categoryData.categories || []);
      setSubscribers(subscriberData.subscribers || []);
      if (settingsData?.settings) setSettingsForm(settingsData.settings);
    } catch (err) {
      console.debug("Refresh error:", err.message);
    }
  }

  useEffect(() => {
    api("/auth/me")
      .then(({ user: current }) => {
        setUser(current);
        return refreshData();
      })
      .catch((err) => {
        if (!err.message.includes("Authentication required") && !err.message.includes("session")) {
          setError(err.message);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: jsonBody({ email, password })
      });
      setUser(result.user);
      await refreshData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setOverview(null);
      setArticles([]);
    } catch (err) {
      setError(err.message);
    }
  }

  function startNewStory() {
    setEditingId("");
    setForm({
      ...blankStory,
      author: user?.email ? user.email.split("@")[0] : "Senior Correspondent",
      category: categories[0]?._id || "",
      publishAt: new Date().toISOString().slice(0, 16)
    });
    setPreviewMode(false);
    setMessage("");
    setError("");
    setActiveTab("editor");
  }

  function startEditStory(article) {
    setEditingId(article._id);
    setForm({
      ...article,
      category: article.category?._id || article.category || "",
      tags: (article.tags || []).join(", "),
      focusKeywords: (article.focusKeywords || []).join(", "),
      publishAt: toLocalDateTime(article.publishAt),
      corrections: article.corrections || []
    });
    setPreviewMode(false);
    setMessage("");
    setError("");
    setActiveTab("editor");
  }

  async function saveStory(e, forceStatus = null) {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const targetStatus = forceStatus || form.status;
    const publishAtDate = new Date(form.publishAt).toISOString();
    const tagsArray = typeof form.tags === "string"
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : form.tags || [];
    const keywordsArray = typeof form.focusKeywords === "string"
      ? form.focusKeywords.split(",").map((k) => k.trim()).filter(Boolean)
      : form.focusKeywords || [];

    const payload = {
      ...form,
      status: targetStatus,
      slug: form.slug || titleToSlug(form.title),
      tags: tagsArray,
      focusKeywords: keywordsArray,
      publishAt: publishAtDate
    };

    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.views;

    try {
      if (editingId) {
        await api(`/admin/articles/${editingId}`, {
          method: "PUT",
          body: jsonBody(payload)
        });
        setMessage(`Story "${payload.title}" updated successfully.`);
      } else {
        await api("/admin/articles", {
          method: "POST",
          body: jsonBody(payload)
        });
        setMessage(`Story "${payload.title}" created successfully.`);
      }
      await refreshData();
      setActiveTab("stories");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteStory(article) {
    if (!window.confirm(`Permanently delete story: "${article.title}"? This action cannot be undone.`)) return;
    try {
      await api(`/admin/articles/${article._id}`, { method: "DELETE" });
      setMessage(`Story deleted.`);
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(article, newStatus) {
    try {
      await api(`/admin/articles/${article._id}/status`, {
        method: "PATCH",
        body: jsonBody({ status: newStatus })
      });
      setMessage(`Story status changed to ${newStatus}.`);
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleBreaking(article) {
    const isBreaking = !article.isBreaking;
    try {
      await api(`/admin/articles/${article._id}/breaking`, {
        method: "PATCH",
        body: jsonBody({ isBreaking, breakingPriority: isBreaking ? 10 : 0 })
      });
      setMessage(`Breaking alert ${isBreaking ? "enabled" : "disabled"} for "${article.title}".`);
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadImageFile(file) {
    if (!file) return;
    const data = new FormData();
    data.append("image", file);
    setBusy(true);
    setError("");

    try {
      const res = await api("/admin/upload", { method: "POST", body: data });
      setForm((cur) => ({ ...cur, imageUrl: res.url }));
      setMessage("Image uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function addCorrection() {
    if (!correctionText.trim()) return;
    setForm((cur) => ({
      ...cur,
      corrections: [...(cur.corrections || []), { date: new Date().toISOString(), text: correctionText.trim() }]
    }));
    setCorrectionText("");
  }

  function removeCorrection(index) {
    setForm((cur) => ({
      ...cur,
      corrections: cur.corrections.filter((_, i) => i !== index)
    }));
  }

  async function saveCategory(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...categoryForm,
      slug: categoryForm.slug || titleToSlug(categoryForm.name)
    };

    try {
      if (categoryEditingId) {
        await api(`/admin/categories/${categoryEditingId}`, {
          method: "PUT",
          body: jsonBody(payload)
        });
        setMessage("Category updated.");
      } else {
        await api("/admin/categories", {
          method: "POST",
          body: jsonBody(payload)
        });
        setMessage("Category created.");
      }
      setCategoryForm({ name: "", slug: "", description: "", order: 0 });
      setCategoryEditingId("");
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api(`/admin/categories/${cat._id}`, { method: "DELETE" });
      setMessage("Category deleted.");
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api("/settings/admin", {
        method: "PUT",
        body: jsonBody(settingsForm)
      });
      setMessage("Monetization & Website settings saved successfully.");
      await refreshData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api("/auth/change-password", {
        method: "POST",
        body: jsonBody({ currentPassword, newPassword })
      });
      setMessage("Password successfully changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Filtered stories list
  const filteredArticles = articles.filter((a) => {
    if (statusFilter === "all") return true;
    return a.status === statusFilter;
  });

  if (checking) {
    return (
      <main className="container page-content">
        <Loading label="Authenticating administrator credentials" />
      </main>
    );
  }

  // Login View
  if (!user) {
    return (
      <main className="container admin-login-page">
        <div className="admin-login-card">
          <div className="login-crest">MR</div>
          <span className="section-flag">AUTHORIZED ACCESS ONLY</span>
          <h1>Newsroom Portal</h1>
          <p className="login-desc">
            Sign in with verified administrator credentials to manage publications, breaking news alerts, and site monetization.
          </p>

          {error && <div className="admin-alert alert-error" role="alert">{error}</div>}

          <form onSubmit={login} className="admin-login-form">
            <label>
              <span>Administrator Email</span>
              <input
                type="email"
                autoComplete="username"
                required
                placeholder="editor@meridianrecord.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              <span>Secure Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button className="button login-btn" disabled={busy}>
              {busy ? "Authenticating Session…" : "Sign In to Newsroom"}
            </button>
          </form>

          <div className="login-security-notice">
            <small>
              🔒 Security Notice: Brute-force attacks are logged and subject to progressive IP lockouts.
              Sessions utilize encrypted HttpOnly tokens.
            </small>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container page-content admin-suite-page">
      {/* Admin Top Masthead */}
      <div className="admin-masthead-banner">
        <div className="admin-title-lockup">
          <span className="section-flag">NEWSROOM COMMAND DESK</span>
          <h1>The Meridian Publishing Suite</h1>
          <p className="admin-meta-text">
            Signed in as <strong>{user.email}</strong> · Session Active
          </p>
        </div>

        <div className="admin-masthead-actions">
          <button className="button button-outline" onClick={logout}>
            Sign Out
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer" className="button">
            View Public Site ↗
          </a>
        </div>
      </div>

      {/* Global Message Alerts */}
      {error && <div className="admin-alert alert-error" role="alert">{error}</div>}
      {message && <div className="admin-alert alert-success" role="status">{message}</div>}

      {/* Live Operational Metrics */}
      {overview && (
        <div className="admin-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">TOTAL STORIES</span>
            <strong className="metric-value">{overview.total}</strong>
          </div>
          <div className="metric-box metric-published">
            <span className="metric-label">PUBLISHED</span>
            <strong className="metric-value">{overview.published}</strong>
          </div>
          <div className="metric-box metric-drafts">
            <span className="metric-label">DRAFTS</span>
            <strong className="metric-value">{overview.drafts}</strong>
          </div>
          <div className="metric-box metric-scheduled">
            <span className="metric-label">SCHEDULED</span>
            <strong className="metric-value">{overview.scheduled}</strong>
          </div>
          <div className="metric-box metric-views">
            <span className="metric-label">TOTAL READS</span>
            <strong className="metric-value">{overview.totalViews.toLocaleString()}</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">SUBSCRIBERS</span>
            <strong className="metric-value">{overview.subscribers}</strong>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="admin-tabs-nav" aria-label="Admin Sections">
        <button
          className={`tab-btn ${activeTab === "stories" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("stories")}
        >
          📰 Stories ({articles.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "editor" ? "active-tab" : ""}`}
          onClick={startNewStory}
        >
          ✍️ {editingId ? "Edit Story" : "New Story"}
        </button>
        <button
          className={`tab-btn ${activeTab === "breaking" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("breaking")}
        >
          🚨 Breaking Ticker
        </button>
        <button
          className={`tab-btn ${activeTab === "categories" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          🏷 Categories ({categories.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "monetization" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("monetization")}
        >
          💰 Monetization &amp; Ads
        </button>
        <button
          className={`tab-btn ${activeTab === "security" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          🛡 Settings &amp; Security
        </button>
      </nav>

      {/* TAB 1: STORIES MANAGEMENT */}
      {activeTab === "stories" && (
        <section className="admin-tab-content">
          <div className="tab-actions-bar">
            <div className="filter-pill-group">
              <span className="filter-label">Filter:</span>
              {["all", "published", "draft", "scheduled", "archived"].map((st) => (
                <button
                  key={st}
                  className={`status-filter-btn ${statusFilter === st ? "active-filter" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>

            <button className="button" onClick={startNewStory}>
              + Compose New Story
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-editorial-table">
              <thead>
                <tr>
                  <th>Headline &amp; Slug</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Reads</th>
                  <th>Publish Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((art) => (
                  <tr key={art._id}>
                    <td className="headline-cell">
                      <strong>{art.title}</strong>
                      <span className="slug-hint">/story/{art.slug}</span>
                      <div className="inline-flags-row">
                        {art.isBreaking && <span className="flag-mini flag-breaking">BREAKING</span>}
                        {art.isFeatured && <span className="flag-mini flag-featured">LEAD</span>}
                        {art.isOpinion && <span className="flag-mini flag-opinion">OPINION</span>}
                        {art.isSponsored && <span className="flag-mini flag-sponsored">SPONSORED</span>}
                      </div>
                    </td>
                    <td>{art.category?.name || "Uncategorized"}</td>
                    <td>
                      <span className={`status-tag status-${art.status}`}>
                        {art.status}
                      </span>
                    </td>
                    <td>{art.views?.toLocaleString() || 0}</td>
                    <td>{formatDate(art.publishAt, { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="actions-cell">
                      <button className="action-btn" onClick={() => startEditStory(art)} title="Edit story">
                        Edit
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => toggleBreaking(art)}
                        title={art.isBreaking ? "Remove from breaking news" : "Promote to breaking news"}
                      >
                        {art.isBreaking ? "Unbreak" : "Breaking"}
                      </button>
                      {art.status === "published" ? (
                        <button className="action-btn" onClick={() => toggleStatus(art, "draft")}>
                          Unpublish
                        </button>
                      ) : (
                        <button className="action-btn" onClick={() => toggleStatus(art, "published")}>
                          Publish
                        </button>
                      )}
                      <button className="action-btn danger-btn" onClick={() => deleteStory(art)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: RICH STORY EDITOR WITH SIDE-BY-SIDE LIVE PREVIEW */}
      {activeTab === "editor" && (
        <section className="admin-tab-content editor-tab-content">
          <div className="editor-top-bar">
            <h2>{editingId ? "Edit Story Package" : "Compose New Article"}</h2>
            <div className="editor-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${!previewMode ? "active-mode" : ""}`}
                onClick={() => setPreviewMode(false)}
              >
                ✏️ Editor
              </button>
              <button
                type="button"
                className={`mode-btn ${previewMode ? "active-mode" : ""}`}
                onClick={() => setPreviewMode(true)}
              >
                👁 Live Preview
              </button>
            </div>
          </div>

          <form onSubmit={(e) => saveStory(e)} className="story-form-layout">
            <div className={`form-columns-split ${previewMode ? "preview-active" : ""}`}>
              {/* Form Input Fields */}
              <div className="editor-fields-pane">
                <div className="field-row">
                  <label>
                    <span className="field-title">Headline (Required, 5–180 chars)</span>
                    <input
                      required
                      minLength="5"
                      maxLength="180"
                      value={form.title}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          title: e.target.value,
                          slug: editingId ? form.slug : titleToSlug(e.target.value)
                        })
                      }
                      placeholder="e.g. Maritime Trade Security and the Indo-Pacific Corridor..."
                    />
                  </label>
                </div>

                <div className="field-grid-2">
                  <label>
                    <span className="field-title">URL Slug (Unique, lowercase alphanumeric)</span>
                    <input
                      required
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    />
                  </label>

                  <label>
                    <span className="field-title">Category</span>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">Select News Section...</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-grid-2">
                  <label>
                    <span className="field-title">Author Name</span>
                    <input
                      required
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      placeholder="e.g. Amb. Rajeshwar Sen"
                    />
                  </label>

                  <label>
                    <span className="field-title">Author Role / Title</span>
                    <input
                      value={form.authorRole}
                      onChange={(e) => setForm({ ...form, authorRole: e.target.value })}
                      placeholder="e.g. Chief Geopolitical Analyst"
                    />
                  </label>
                </div>

                <label>
                  <span className="field-title">Summary / Standfirst Deck (20–360 chars)</span>
                  <textarea
                    required
                    minLength="20"
                    maxLength="360"
                    rows="3"
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    placeholder="Provide a concise, compelling editorial summary for headlines and search discovery..."
                  />
                </label>

                <label>
                  <span className="field-title">
                    Article Body (Markdown Supported · Raw HTML Sanitized)
                  </span>
                  <textarea
                    required
                    minLength="20"
                    rows="16"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Write article body in clean Markdown. Use ## for subheadings, > for pull quotes..."
                  />
                </label>

                {/* Media Section */}
                <fieldset className="editor-fieldset">
                  <legend>Hero Media &amp; Photography</legend>
                  <div className="field-grid-2">
                    <label>
                      <span className="field-title">Image URL (HTTPS or Local Upload)</span>
                      <input
                        type="url"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                      />
                    </label>

                    <label>
                      <span className="field-title">Or Upload Local Image (Max 5 MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(e) => e.target.files?.[0] && uploadImageFile(e.target.files[0])}
                      />
                    </label>
                  </div>

                  {form.imageUrl && (
                    <div className="editor-image-preview">
                      <img src={form.imageUrl} alt="Uploaded preview" />
                    </div>
                  )}

                  <div className="field-grid-2">
                    <label>
                      <span className="field-title">Image Alternative Text</span>
                      <input
                        value={form.imageAlt}
                        onChange={(e) => setForm({ ...form, imageAlt: e.target.value })}
                        placeholder="Descriptive text for accessibility..."
                      />
                    </label>

                    <label>
                      <span className="field-title">Image Credit / Photographer Attribution</span>
                      <input
                        value={form.imageCredit}
                        onChange={(e) => setForm({ ...form, imageCredit: e.target.value })}
                        placeholder="e.g. The Meridian Record / Reuters"
                      />
                    </label>
                  </div>
                </fieldset>

                {/* Publishing Controls */}
                <fieldset className="editor-fieldset">
                  <legend>Publishing Status &amp; Scheduling</legend>
                  <div className="field-grid-3">
                    <label>
                      <span className="field-title">Publication Status</span>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="draft">Draft (Private)</option>
                        <option value="published">Published (Public)</option>
                        <option value="scheduled">Scheduled (Future release)</option>
                        <option value="archived">Archived (Unlisted)</option>
                      </select>
                    </label>

                    <label>
                      <span className="field-title">Publication Date &amp; Time</span>
                      <input
                        type="datetime-local"
                        required
                        value={form.publishAt}
                        onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                      />
                    </label>

                    <label>
                      <span className="field-title">Est. Reading Time (Mins)</span>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={form.readingTime}
                        onChange={(e) => setForm({ ...form, readingTime: Number(e.target.value) })}
                      />
                    </label>
                  </div>

                  <div className="editorial-flags-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.isBreaking}
                        onChange={(e) => setForm({ ...form, isBreaking: e.target.checked })}
                      />
                      <span>🚨 Breaking News Alert</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      />
                      <span>⭐ Frontpage Lead Feature</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.isTrending}
                        onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
                      />
                      <span>🔥 Trending Now</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.isOpinion}
                        onChange={(e) => setForm({ ...form, isOpinion: e.target.checked })}
                      />
                      <span>✒️ Opinion Column</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.isSponsored}
                        onChange={(e) => setForm({ ...form, isSponsored: e.target.checked })}
                      />
                      <span>💼 Sponsored Content</span>
                    </label>
                  </div>
                </fieldset>

                {/* SEO & Meta Accordion */}
                <fieldset className="editor-fieldset">
                  <legend>SEO &amp; News Discovery Metadata</legend>
                  <div className="field-grid-2">
                    <label>
                      <span className="field-title">Custom Meta Title (Max 120 chars)</span>
                      <input
                        maxLength="120"
                        value={form.metaTitle}
                        onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                        placeholder="Leave blank to use story headline"
                      />
                    </label>

                    <label>
                      <span className="field-title">Canonical URL Override</span>
                      <input
                        type="url"
                        value={form.canonicalUrl}
                        onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                        placeholder="Leave blank for automatic canonical"
                      />
                    </label>
                  </div>

                  <label>
                    <span className="field-title">Tags (Comma-separated)</span>
                    <input
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      placeholder="e.g. geopolitics, maritime, defence, navy"
                    />
                  </label>
                </fieldset>

                {/* Editorial Corrections Box */}
                <fieldset className="editor-fieldset">
                  <legend>Corrections &amp; Clarifications Notice</legend>
                  <div className="corrections-manager">
                    {form.corrections?.map((corr, idx) => (
                      <div key={idx} className="correction-row-item">
                        <span>{corr.text}</span>
                        <button type="button" className="danger-btn" onClick={() => removeCorrection(idx)}>
                          Remove
                        </button>
                      </div>
                    ))}

                    <div className="add-correction-input">
                      <input
                        placeholder="Log factual correction (e.g. 'Corrected tonnage calculation in paragraph 4')..."
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                      />
                      <button type="button" className="button button-outline" onClick={addCorrection}>
                        Add Notice
                      </button>
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Live Preview Pane */}
              <div className="editor-preview-pane">
                <div className="preview-chrome-bar">
                  <span className="preview-label">LIVE STORY PREVIEW</span>
                  <span className="preview-status">{form.status.toUpperCase()}</span>
                </div>

                <div className="preview-story-paper">
                  <div className="article-kicker-bar">
                    <span className="article-category-kicker">
                      {categories.find((c) => c._id === form.category)?.name || "CATEGORY"}
                    </span>
                    {form.isBreaking && <span className="breaking-badge">BREAKING</span>}
                    {form.isOpinion && <span className="opinion-label">OPINION</span>}
                  </div>

                  <h1 className="preview-headline">{form.title || "Untitled Article"}</h1>
                  <p className="preview-deck">{form.summary || "Summary standfirst will appear here..."}</p>

                  <div className="preview-byline">
                    <span>By <strong>{form.author || "Author"}</strong></span>
                    <span>· {form.authorRole}</span>
                  </div>

                  {form.imageUrl && (
                    <figure className="preview-figure">
                      <img src={form.imageUrl} alt={form.imageAlt || "Preview"} />
                      {form.imageCredit && <figcaption>Credit: {form.imageCredit}</figcaption>}
                    </figure>
                  )}

                  <div className="preview-markdown-body">
                    <ReactMarkdown>{form.body || "*No article body written yet.*"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="editor-submit-bar">
              <div className="submit-left">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setActiveTab("stories")}
                >
                  Cancel
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="button danger-btn"
                    onClick={() => deleteStory({ _id: editingId, title: form.title })}
                  >
                    Delete Story
                  </button>
                )}
              </div>

              <div className="submit-right">
                <button
                  type="button"
                  className="button button-outline"
                  disabled={busy}
                  onClick={(e) => saveStory(e, "draft")}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="button"
                  disabled={busy}
                >
                  {busy ? "Saving…" : form.status === "published" ? "Publish Changes" : "Save & Update"}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* TAB 3: BREAKING NEWS CONTROLLER */}
      {activeTab === "breaking" && (
        <section className="admin-tab-content">
          <div className="tab-header">
            <h2>Breaking News Ticker &amp; Urgent Alerts</h2>
            <p>Control live headlines cycling on the top ticker banner across the entire website.</p>
          </div>

          <div className="breaking-manager-card">
            <h3>Active Breaking Headlines</h3>
            <ul className="breaking-stories-list">
              {articles.filter((a) => a.isBreaking).map((art) => (
                <li key={art._id} className="breaking-item-row">
                  <div>
                    <strong>{art.title}</strong>
                    <span className="slug-hint">Priority: {art.breakingPriority || 0}</span>
                  </div>
                  <button className="button button-outline" onClick={() => toggleBreaking(art)}>
                    Remove from Breaking
                  </button>
                </li>
              ))}
            </ul>

            {articles.filter((a) => a.isBreaking).length === 0 && (
              <p className="empty-hint">No stories are currently marked as Breaking. You can promote any published story below.</p>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: CATEGORIES MANAGEMENT */}
      {activeTab === "categories" && (
        <section className="admin-tab-content">
          <div className="tab-header">
            <h2>Editorial Categories &amp; Navigation Desks</h2>
            <p>Manage the editorial taxonomy and top navigation sections.</p>
          </div>

          <div className="categories-two-col">
            <form onSubmit={saveCategory} className="category-form-box">
              <h3>{categoryEditingId ? "Edit Category" : "Add News Section"}</h3>
              <label>
                <span>Category Name</span>
                <input
                  required
                  placeholder="e.g. Geopolitics"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      name: e.target.value,
                      slug: categoryEditingId ? categoryForm.slug : titleToSlug(e.target.value)
                    })
                  }
                />
              </label>

              <label>
                <span>URL Slug</span>
                <input
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="e.g. geopolitics"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                />
              </label>

              <label>
                <span>Section Description (For SEO &amp; Header)</span>
                <textarea
                  rows="3"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </label>

              <div className="form-action-buttons">
                <button className="button">{categoryEditingId ? "Update Section" : "Add Section"}</button>
                {categoryEditingId && (
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => {
                      setCategoryEditingId("");
                      setCategoryForm({ name: "", slug: "", description: "", order: 0 });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="categories-list-box">
              <h3>Active Editorial Sections</h3>
              <ul className="categories-admin-list">
                {categories.map((cat) => (
                  <li key={cat._id} className="category-item-card">
                    <div>
                      <strong>{cat.name}</strong>
                      <span className="slug-hint">/category/{cat.slug}</span>
                      <p className="cat-desc-preview">{cat.description}</p>
                    </div>
                    <div className="cat-actions">
                      <button
                        className="action-btn"
                        onClick={() => {
                          setCategoryEditingId(cat._id);
                          setCategoryForm({
                            name: cat.name,
                            slug: cat.slug,
                            description: cat.description || "",
                            order: cat.order || 0
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className="action-btn danger-btn" onClick={() => deleteCategory(cat)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: MONETIZATION & GOOGLE ADSENSE */}
      {activeTab === "monetization" && (
        <section className="admin-tab-content">
          <div className="tab-header">
            <h2>Google AdSense &amp; Revenue Configuration</h2>
            <p>
              Configure verified Google AdSense Publisher IDs, ad slots, and native sponsorship disclosures.
              When unconfigured, tasteful non-deceptive placeholders appear.
            </p>
          </div>

          {settingsForm ? (
            <form onSubmit={saveSettings} className="settings-form-box">
              <fieldset className="editor-fieldset">
                <legend>Google AdSense Integration</legend>
                <div className="field-row">
                  <label>
                    <span className="field-title">Google AdSense Publisher ID</span>
                    <input
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      value={settingsForm.adsenseClientId || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adsenseClientId: e.target.value })}
                    />
                    <small className="field-hint">Must match format ca-pub-XXXXXXXXXXXXXXXX.</small>
                  </label>
                </div>

                <div className="field-grid-3">
                  <label>
                    <span className="field-title">Header Leaderboard Slot ID</span>
                    <input
                      placeholder="e.g. 1234567890"
                      value={settingsForm.adsenseHeaderSlot || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adsenseHeaderSlot: e.target.value })}
                    />
                  </label>

                  <label>
                    <span className="field-title">Sidebar Rail Slot ID</span>
                    <input
                      placeholder="e.g. 2345678901"
                      value={settingsForm.adsenseSidebarSlot || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adsenseSidebarSlot: e.target.value })}
                    />
                  </label>

                  <label>
                    <span className="field-title">In-Article Stream Slot ID</span>
                    <input
                      placeholder="e.g. 3456789012"
                      value={settingsForm.adsenseInArticleSlot || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adsenseInArticleSlot: e.target.value })}
                    />
                  </label>
                </div>

                <label className="checkbox-label" style={{ marginTop: "15px" }}>
                  <input
                    type="checkbox"
                    checked={settingsForm.adsEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, adsEnabled: e.target.checked })}
                  />
                  <span>Enable Monetization Placements Across Website</span>
                </label>
              </fieldset>

              <fieldset className="editor-fieldset">
                <legend>Sponsored Content &amp; Disclosures</legend>
                <label>
                  <span className="field-title">Sponsored Editorial Feature Disclaimer</span>
                  <textarea
                    rows="3"
                    value={settingsForm.sponsoredDisclaimer || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, sponsoredDisclaimer: e.target.value })}
                  />
                </label>
              </fieldset>

              <button className="button" disabled={busy}>
                {busy ? "Saving Configuration…" : "Save Monetization Settings"}
              </button>
            </form>
          ) : (
            <Loading label="Loading settings" />
          )}
        </section>
      )}

      {/* TAB 6: SETTINGS & SECURITY */}
      {activeTab === "security" && (
        <section className="admin-tab-content">
          <div className="tab-header">
            <h2>Newsroom Security &amp; Credentials</h2>
            <p>Rotate administrator passwords and configure fundamental publication details.</p>
          </div>

          <div className="security-cards-grid">
            {/* Password Change Box */}
            <form onSubmit={handlePasswordChange} className="settings-form-box">
              <h3>Rotate Administrator Password</h3>
              <p className="security-subtext">
                Password must be at least 12 characters and include uppercase, lowercase, and numbers.
              </p>

              <label>
                <span>Current Administrator Password</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>

              <label>
                <span>New Secure Password</span>
                <input
                  type="password"
                  required
                  minLength="12"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label>
                <span>Confirm New Password</span>
                <input
                  type="password"
                  required
                  minLength="12"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>

              <button className="button" disabled={busy}>
                {busy ? "Updating…" : "Update Password"}
              </button>
            </form>

            {/* Newsletter Subscribers Overview */}
            <div className="subscribers-box settings-form-box">
              <h3>Newsletter Subscribers ({subscribers.length})</h3>
              <p className="security-subtext">
                Readers who gave affirmative consent to receive The Meridian Morning Dispatch.
              </p>

              <div className="subscribers-list-wrap">
                {subscribers.map((sub) => (
                  <div key={sub._id} className="subscriber-row">
                    <span>{sub.email}</span>
                    <small>{formatDate(sub.consentedAt)}</small>
                  </div>
                ))}
                {subscribers.length === 0 && <p className="empty-hint">No subscribers yet.</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
