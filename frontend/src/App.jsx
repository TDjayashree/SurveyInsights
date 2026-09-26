import { useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import SurveyBuilder from './components/SurveyBuilder.jsx';
import SurveyForm from './components/SurveyForm.jsx';
import SurveyPreview from './components/SurveyPreview.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import { getAdminToken, setAdminToken, isAuthenticated } from './api';

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [route, id] = hash.split('/');
  return { route: route || 'home', id };
}

export default function App() {
  const [nav, setNav] = useState(parseHash());
  const [adminLoggedIn, setAdminLoggedIn] = useState(isAuthenticated());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onHashChange = () => setNav(parseHash());
    const onAuthChange = () => setAdminLoggedIn(isAuthenticated());

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('auth_changed', onAuthChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('auth_changed', onAuthChange);
    };
  }, []);

  const goTo = (route, id) => {
    window.location.hash = id ? `/${route}/${id}` : `/${route}`;
  };

  const handleLogout = () => {
    setAdminToken('');
    setAdminLoggedIn(false);
    goTo('login');
  };

  // 1. SURVEY TAKER VIEW: completely isolated, styled like Stripe Checkout
  if (nav.route === 'take') {
    return (
      <div className="app taker-mode">
        <div className="stripe-mesh-gradient-bg"></div>
        <header className="taker-topbar">
          <div className="taker-topbar-inner">
            <div className="taker-brand">
              <div className="stripe-brand-glyph small">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#tgrad)" />
                  <path d="M8 10h16M8 16h11M8 22h14" stroke="#ffffff" strokeWidth="2.75" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="tgrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#635BFF" />
                      <stop offset="0.5" stopColor="#00D4FF" />
                      <stop offset="1" stopColor="#00D4B2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="taker-brand-text">
                <span className="taker-brand-title">Survey Insights</span>
                <span className="taker-brand-sub">Feedback Portal</span>
              </div>
            </div>
            <div className="taker-badges">
              <div className="taker-role-badge">
                <svg className="lock-icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>End-to-End Encrypted</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content taker-content">
          <SurveyForm surveyId={nav.id} />
        </main>

        <footer className="taker-page-footer">
          <div className="taker-footer-inner">
            <div className="powered-by-tag">
              <span className="powered-text">Powered by</span>
              <span className="stripe-styled-brand">Survey Insights</span>
              <span className="footer-dot">·</span>
              <span className="footer-meta">Privacy & Terms</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. SURVEYOR / ADMIN AREA: Protected with passcode authentication
  const isAuthorized = adminLoggedIn;

  return (
    <div className="app admin-mode">
      <div className="stripe-mesh-gradient-bg"></div>

      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand" onClick={() => isAuthorized && goTo('home')}>
            <div className="stripe-brand-glyph">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill="url(#agrad)" />
                <path d="M8 22l6-8 4 4 6-9" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="24" cy="9" r="2" fill="#00D4FF" />
                <defs>
                  <linearGradient id="agrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#635BFF" />
                    <stop offset="0.6" stopColor="#00D4FF" />
                    <stop offset="1" stopColor="#00D4B2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Survey<span className="brand-accent">Insights</span></span>
            </div>
            <span className="admin-portal-badge">
              <span className="live-dot"></span> Console
            </span>
          </div>

          {isAuthorized && (
            <div className="topbar-search">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="searchIconGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7C72FF" />
                    <stop offset="100%" stopColor="#00D4FF" />
                  </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="7.5" stroke="url(#searchIconGrad)" />
                <path d="m20.5 20.5-4.2-4.2" stroke="url(#searchIconGrad)" />
              </svg>
              <input
                type="text"
                placeholder="Search surveys, responses, telemetry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {isAuthorized && (
            <nav className="topbar-nav">
              <button
                className={`nav-btn ${nav.route === 'home' ? 'active' : ''}`}
                onClick={() => goTo('home')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Surveys</span>
              </button>
              <button
                className={`nav-btn new-btn ${nav.route === 'new' ? 'active' : ''}`}
                onClick={() => goTo('new')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Survey</span>
              </button>

              <div className="topbar-divider"></div>

              <div className="user-profile-chip" title="Admin Operator">
                <div className="user-avatar">A</div>
                <span className="user-name">admin@SurveyInsights</span>
              </div>

              <button className="nav-btn logout-btn" onClick={handleLogout} title="Sign Out">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Sign Out</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="content">
        {!isAuthorized ? (
          <AdminLogin onLoginSuccess={() => setAdminLoggedIn(true)} />
        ) : (
          <>
            {nav.route === 'home' && <Home goTo={goTo} searchQuery={searchQuery} />}
            {nav.route === 'new' && <SurveyBuilder goTo={goTo} />}
            {nav.route === 'preview' && <SurveyPreview surveyId={nav.id} goTo={goTo} />}
            {nav.route === 'dashboard' && <Dashboard surveyId={nav.id} goTo={goTo} />}
            {nav.route === 'login' && <Home goTo={goTo} searchQuery={searchQuery} />}
          </>
        )}
      </main>

      {isAuthorized && (
        <footer className="admin-page-footer">
          <div className="admin-footer-inner">
            <div className="system-status-indicator">
              <span className="status-ping"></span>
              <span className="status-text">All Systems Operational · 99.99% Telemetry Uptime</span>
            </div>
            <div className="admin-footer-links">
              <span>API v2.4</span>
              <span>·</span>
              <span>Documentation</span>
              <span>·</span>
              <span>Support</span>
              <span>·</span>
              <span>Survey Insights Platform</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

