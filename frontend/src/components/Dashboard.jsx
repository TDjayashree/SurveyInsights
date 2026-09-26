import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { adminFetch } from '../api';

const COLORS = ['#635BFF', '#00D4FF', '#00D4B2', '#FF5E97', '#FFA256', '#7A73FF'];

export default function Dashboard({ surveyId, goTo }) {
  const [insights, setInsights] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('insights');
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      adminFetch(`/api/surveys/${surveyId}/insights`).then(r => {
        if (!r.ok) throw new Error('Survey not found');
        return r.json();
      }),
      adminFetch(`/api/surveys/${surveyId}/cases`).then(r => r.json()),
    ])
      .then(([i, c]) => {
        setInsights(i);
        setCases(c);
      })
      .catch(err => {
        setError(err.message || 'Failed to load survey dashboard');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [surveyId]);

  const resolveCase = async (id, status) => {
    try {
      await adminFetch(`/api/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      alert(err.message || 'Failed to update case');
    }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}#/take/${surveyId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="panel stripe-main-panel">
        <div className="stripe-loading-skeleton">
          <div className="skeleton-bar" style={{ width: '40%' }}></div>
          <div className="skeleton-card" style={{ height: '140px' }}></div>
          <div className="skeleton-card" style={{ height: '300px' }}></div>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="panel centered stripe-main-panel">
        <div className="error-icon">⚠️</div>
        <h2>Dashboard Unavailable</h2>
        <p className="error">{error || 'Survey not found.'}</p>
        <button className="btn" style={{ marginTop: '16px' }} onClick={() => goTo('home')}>
          ← Back to Surveys
        </button>
      </div>
    );
  }

  const openCases = cases.filter(c => c.status === 'open');

  // Calculate NPS score metrics if available
  const npsQuestion = insights.perQuestion.find(q => q.type === 'nps');

  return (
    <div className="stripe-dashboard-container">
      {/* Stripe Dashboard Breadcrumbs & Title */}
      <div className="dashboard-nav-header">
        <div className="breadcrumbs">
          <span className="crumb-link" onClick={() => goTo('home')}>Surveys</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">{insights.survey.title}</span>
          <span className="live-status-pill small" style={{ marginLeft: '12px' }}>
            <span className="status-dot"></span> Live Telemetry
          </span>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn small action-preview-btn"
            title="Preview survey questions (read-only mode)"
            onClick={() => goTo('preview', surveyId)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Preview Survey</span>
          </button>

          <button className="btn small" onClick={() => goTo('home')}>
            ← Back to Surveys
          </button>
        </div>
      </div>

      <div className="dashboard-title-row">
        <div>
          <h1 className="dashboard-title">{insights.survey.title}</h1>
          <p className="dashboard-subtitle">
            {insights.survey.description || 'Live customer feedback intelligence and NPS anomaly detection'}
          </p>
        </div>
      </div>

      {/* Stripe Share Box / Webhook Style Card */}
      <div className="share-box stripe-share-card">
        <div className="share-box-top">
          <div className="share-box-title">
            <div className="share-icon-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#635BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <strong>Public Respondent Link</strong>
            <span className="taker-restricted-badge">Zero-Auth Respondent Link</span>
          </div>
          <span className="share-info-text">
            Send this URL to customers via email, SMS. Respondents can submit answers securely with zero access to your analytics console.
          </span>
        </div>

        <div className="share-row">
          <div className="share-input-wrapper">
            <input className="share-link-input" readOnly value={shareUrl} />
          </div>
          <button className={`btn primary small ${copied ? 'copied' : ''}`} onClick={handleCopyLink}>
            {copied ? '✓ Copied to Clipboard!' : 'Copy Respondent URL'}
          </button>
        </div>
      </div>

      {/* Stripe Metric Stats Grid */}
      <div className="stat-row stripe-stats-grid">
        <div className="stat-box stripe-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Responses</span>
            <span className="stat-trend positive">↑ Live</span>
          </div>
          <div className="stat-value">{insights.totalResponses}</div>
          <div className="stat-caption">Recorded customer submissions</div>
        </div>

        <div className="stat-box stripe-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">NPS Net Score</span>
            <span className={`stat-trend ${npsQuestion?.npsScore >= 0 ? 'positive' : 'negative'}`}>
              {npsQuestion?.count > 0 ? (npsQuestion.npsScore > 0 ? `+${npsQuestion.npsScore}` : npsQuestion.npsScore) : 'N/A'}
            </span>
          </div>
          <div className="stat-value">
            {npsQuestion?.count > 0 ? npsQuestion.npsScore : '—'}
          </div>
          <div className="stat-caption">
            {npsQuestion?.count > 0
              ? `${npsQuestion.count} rating${npsQuestion.count !== 1 ? 's' : ''} aggregated`
              : 'Add an NPS question to track score'}
          </div>
        </div>

        <div className="stat-box stripe-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Radar Case Queue</span>
            {openCases.length > 0 ? (
              <span className="stat-trend warning">Needs Action</span>
            ) : (
              <span className="stat-trend positive">All Clear</span>
            )}
          </div>
          <div className="stat-value" style={{ color: openCases.length > 0 ? '#ED5F74' : 'inherit' }}>
            {openCases.length}
          </div>
          <div className="stat-caption">Negative feedback escalations requiring triage</div>
        </div>

        <div className="stat-box stripe-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">System Health</span>
            <span className="stat-trend positive">Optimal</span>
          </div>
          <div className="stat-value">100%</div>
          <div className="stat-caption">Active collector endpoint response rate</div>
        </div>
      </div>

      {/* Stripe Segment Tabs */}
      <div className="tabs stripe-tabs">
        <button
          className={`tab ${tab === 'insights' ? 'active' : ''}`}
          onClick={() => setTab('insights')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Business Intelligence</span>
        </button>
        <button
          className={`tab ${tab === 'cases' ? 'active' : ''}`}
          onClick={() => setTab('cases')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Radar Escalations</span>
          {openCases.length > 0 && <span className="badge radar-badge">{openCases.length}</span>}
        </button>
      </div>

      {/* BI TAB CONTENT */}
      {tab === 'insights' && (
        <div className="insights-grid">
          {insights.totalResponses === 0 && (
            <div className="empty-insights stripe-empty-state">
              <div className="empty-illustration">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#635BFF" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3>Awaiting first respondent</h3>
              <p className="muted">
                Copy and share the public taker link above. Live responses and sentiment charts will populate here automatically.
              </p>
            </div>
          )}

          {insights.overTime.length > 1 && (
            <div className="chart-card stripe-chart-card">
              <div className="chart-header">
                <div>
                  <h4>Submission Velocity Over Time</h4>
                  <span className="chart-sub">Volume of completed responses grouped by timestamp</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={insights.overTime}>
                  <defs>
                    <linearGradient id="stripeVelocityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#635BFF" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#635BFF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EDF2F7" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={12} stroke="#8792A2" tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#8792A2" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A2540',
                      color: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                      fontSize: '13px',
                      padding: '8px 12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Responses"
                    stroke="#635BFF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#stripeVelocityGrad)"
                    dot={{ r: 4, fill: '#635BFF', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 7, fill: '#00D4FF', strokeWidth: 2, stroke: '#FFFFFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {insights.perQuestion.map((q, idx) => (
            <div className="chart-card stripe-chart-card" key={q.id}>
              <div className="chart-header">
                <div className="question-prompt-header">
                  <span className="q-badge">Question {idx + 1}</span>
                  <h4>{q.prompt}</h4>
                </div>
                <span className="q-type-pill">{q.type.toUpperCase()}</span>
              </div>

              {q.type === 'nps' && q.count > 0 && (
                <>
                  <div className="nps-summary stripe-nps-summary">
                    <div className="nps-metric-item">
                      <strong>{q.npsScore > 0 ? `+${q.npsScore}` : q.npsScore}</strong>
                      <span>Net Promoter Score</span>
                    </div>
                    <div className="nps-metric-item">
                      <strong>{q.avg?.toFixed(1)} / 10</strong>
                      <span>Mean Rating</span>
                    </div>
                    <div className="nps-metric-item">
                      <strong>{q.count}</strong>
                      <span>Total Ratings</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={q.distribution}>
                      <defs>
                        <linearGradient id="barNpsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#635BFF" />
                          <stop offset="100%" stopColor="#7A73FF" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#EDF2F7" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="score" fontSize={12} stroke="#8792A2" tickLine={false} />
                      <YAxis allowDecimals={false} fontSize={12} stroke="#8792A2" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A2540',
                          color: '#fff',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          fontSize: '13px'
                        }}
                      />
                      <Bar dataKey="count" name="Respondents" fill="url(#barNpsGrad)" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {q.type === 'mcq' && q.count > 0 && (
                <div className="mcq-chart-row">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={Object.entries(q.counts).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {Object.keys(q.counts).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A2540',
                          color: '#fff',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '13px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {q.type === 'text' && (
                <div className="text-samples stripe-text-samples">
                  {q.samples.length === 0 ? (
                    <p className="muted">No text responses collected yet.</p>
                  ) : (
                    q.samples.map((s, i) => (
                      <div key={i} className="text-sample-card">
                        <div className="quote-icon">“</div>
                        <p className="sample-text">{s}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {q.count === 0 && q.type !== 'text' && (
                <p className="muted" style={{ padding: '16px 0' }}>No responses recorded yet for this question.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CASES TAB (RADAR STYLE ESCALATION) */}
      {tab === 'cases' && (
        <div className="cases-section">
          <div className="cases-header-card">
            <div>
              <h3>Radar Automated Feedback Escalations</h3>
              <p className="muted">
                Rules-engine automated alerts triggered whenever respondents provide an NPS rating of 6 or below (Detractor threshold).
              </p>
            </div>
          </div>

          <div className="cases-list">
            {cases.length === 0 ? (
              <div className="empty-cases-banner">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D4B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <div>
                  <strong>No open customer escalations</strong>
                  <p className="muted" style={{ margin: '4px 0 0' }}>
                    All respondent scores are healthy or existing alerts have been resolved.
                  </p>
                </div>
              </div>
            ) : (
              cases.map(c => (
                <div className={`case-card stripe-case-card ${c.status}`} key={c.id}>
                  <div className="case-status-indicator">
                    <span className={`case-dot ${c.status}`}></span>
                  </div>
                  <div className="case-content">
                    <div className="case-top-meta">
                      <span className={`case-badge ${c.status}`}>
                        {c.status === 'open' ? 'Action Required' : 'Resolved'}
                      </span>
                      <span className="case-id">Case #{c.id}</span>
                      <span className="case-date">Opened {c.created_at}</span>
                    </div>
                    <p className="case-reason">{c.reason}</p>
                  </div>
                  <div className="case-actions">
                    <button
                      className={`btn small ${c.status === 'open' ? 'primary' : 'secondary'}`}
                      onClick={() => resolveCase(c.id, c.status === 'open' ? 'resolved' : 'open')}
                    >
                      {c.status === 'open' ? 'Mark Resolved ✓' : 'Reopen Case'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

