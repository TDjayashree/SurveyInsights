import { useEffect, useState } from 'react';
import { adminFetch } from '../api';

export default function Home({ goTo, searchQuery = '' }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [filterTab, setFilterTab] = useState('all');

  const load = () => {
    setLoading(true);
    setError('');
    adminFetch('/api/surveys')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load surveys');
        return r.json();
      })
      .then(setSurveys)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id, title) => {
    if (!confirm(`Delete survey "${title}" and all its historical responses?`)) return;
    try {
      await adminFetch(`/api/surveys/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message || 'Failed to delete survey');
    }
  };

  const copySurveyLink = (id) => {
    const url = `${window.location.origin}${window.location.pathname}#/take/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter based on search query and active tab
  const filteredSurveys = surveys.filter(s => {
    const matchesSearch =
      !searchQuery ||
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'active') return (s.response_count || 0) > 0;
    if (filterTab === 'new') return (s.response_count || 0) === 0;
    return true;
  });

  const totalResponses = surveys.reduce((acc, s) => acc + (s.response_count || 0), 0);
  const activeSurveysCount = surveys.filter(s => (s.response_count || 0) > 0).length;
  const responseCoverage = surveys.length > 0
    ? Math.round((activeSurveysCount / surveys.length) * 100)
    : 0;

  return (
    <div className="stripe-page-container">
      {/* Stripe Hero Banner */}
      <section className="stripe-hero-banner">
        <div className="hero-content">
          <div className="hero-pill-badge">
            <span className="badge-sparkle">✨</span>
            <span className="badge-text">Developer Platform & Feedback Infrastructure</span>
            <span className="badge-arrow">→</span>
          </div>

          <h1 className="hero-headline">
            Customer telemetry for <br />
            <span className="stripe-gradient-text">modern internet businesses</span>
          </h1>

          <p className="hero-subhead">
            Deploy interactive surveys, aggregate real-time CSAT and NPS metrics, and automate negative sentiment case escalation through developer-first tooling.
          </p>

          <div className="hero-actions">
            <button className="btn primary stripe-hero-btn" onClick={() => goTo('new')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Create New Survey</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Stripe Quick KPI Highlights */}
        <div className="hero-kpis">
          <div className="hero-kpi-card">
            <div className="kpi-icon-wrap violet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{surveys.length}</span>
              <span className="kpi-label">Total Surveys</span>
            </div>
          </div>

          <div className="hero-kpi-card">
            <div className="kpi-icon-wrap cyan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{totalResponses}</span>
              <span className="kpi-label">Responses Collected</span>
            </div>
          </div>

          <div className="hero-kpi-card" title={`${activeSurveysCount} of ${surveys.length} surveys have collected responses`}>
            <div className="kpi-icon-wrap emerald">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{responseCoverage}%</span>
              <span className="kpi-label">Response Coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Surveys Section */}
      <div className="panel stripe-main-panel">
        <div className="panel-header-row">
          <div>
            <div className="section-eyebrow">WORKSPACE REPOSITORY</div>
            <h2 className="section-heading">Deployed Surveys</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Manage survey templates, copy zero-login taker links, and review response telemetry.
            </p>
          </div>

          <div className="panel-header-actions">
            <div className="filter-segmented-tabs">
              <button
                className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All ({surveys.length})
              </button>
              <button
                className={`filter-tab ${filterTab === 'active' ? 'active' : ''}`}
                onClick={() => setFilterTab('active')}
              >
                With Responses
              </button>
              <button
                className={`filter-tab ${filterTab === 'new' ? 'active' : ''}`}
                onClick={() => setFilterTab('new')}
              >
                Unanswered
              </button>
            </div>

            <button className="btn primary" onClick={() => goTo('new')}>
              + Create Survey
            </button>
          </div>
        </div>

        {loading && (
          <div className="stripe-loading-skeleton">
            <div className="skeleton-bar" style={{ width: '60%' }}></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        )}

        {error && (
          <div className="stripe-error-callout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filteredSurveys.length === 0 && (
          <div className="stripe-empty-state">
            <div className="empty-illustration">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#635BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3>No surveys found</h3>
            <p className="muted">
              {searchQuery
                ? `No surveys match your search term "${searchQuery}".`
                : 'Get started by creating your first survey to capture customer sentiment and feedback.'}
            </p>
            <button className="btn primary" onClick={() => goTo('new')} style={{ marginTop: '16px' }}>
              + Create Survey
            </button>
          </div>
        )}

        <div className="survey-list">
          {filteredSurveys.map(s => (
            <div className="survey-card stripe-card-interactive" key={s.id}>
              <div className="survey-card-info">
                <div className="survey-title-row">
                  <h3 className="survey-title-text">{s.title}</h3>
                  <span className="live-status-pill">
                    <span className="status-dot"></span> Live
                  </span>
                </div>
                {s.description ? (
                  <p className="survey-desc-text">{s.description}</p>
                ) : (
                  <p className="survey-desc-text italic">No description provided</p>
                )}

                <div className="survey-meta-tags">
                  <span className="meta-pill response-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {s.response_count} response{s.response_count !== 1 ? 's' : ''}
                  </span>
                  <span className="meta-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Created {s.created_at?.split(' ')[0] || 'recently'}
                  </span>
                  <span className="meta-id">ID: {s.id.slice(0, 8)}...</span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className={`btn small action-copy-btn ${copiedId === s.id ? 'copied' : ''}`}
                  title="Copy public link to distribute to survey respondents"
                  onClick={() => copySurveyLink(s.id)}
                >
                  {copiedId === s.id ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D4B2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      <span>Copy Taker Link</span>
                    </>
                  )}
                </button>

                <button
                  className="btn small preview-btn"
                  title="Preview survey questions (read-only mode)"
                  onClick={() => goTo('preview', s.id)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Preview</span>
                </button>

                <button
                  className="btn small primary dashboard-btn"
                  title="View business intelligence analytics and triage cases"
                  onClick={() => goTo('dashboard', s.id)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  <span>Insights & Cases</span>
                  <span className="btn-arrow">→</span>
                </button>

                <button
                  className="btn danger small icon-only-btn"
                  title="Delete survey"
                  onClick={() => remove(s.id, s.title)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

