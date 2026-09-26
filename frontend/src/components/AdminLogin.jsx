import { useState } from 'react';
import { setAdminToken } from '../api';

export default function AdminLogin({ onLoginSuccess }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!passcode.trim()) {
      return setError('Please enter the admin passcode.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passcode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAdminToken(data.token);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || 'Incorrect passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefault = () => {
    setPasscode('admin123');
    setError('');
  };

  return (
    <div className="login-wrapper stripe-login-wrapper">
      <div className="panel login-panel stripe-login-panel">
        <div className="login-logo-glyph">
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="url(#loginGlyphGrad)" />
            <path d="M8 22l6-8 4 4 6-9" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="9" r="2" fill="#00D4FF" />
            <defs>
              <linearGradient id="loginGlyphGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#635BFF" />
                <stop offset="0.6" stopColor="#00D4FF" />
                <stop offset="1" stopColor="#00D4B2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="login-header-group">
          <span className="login-pre-badge">ENTERPRISE CONSOLE</span>
          <h2 className="login-title">Sign in to Survey Insights</h2>
          <p className="muted login-sub">
            Manage feedback infrastructure, configure telemetry pipelines, and triage customer escalation cases.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span className="field-label">ADMIN OPERATOR PASSCODE</span>
            <div className="input-with-button">
              <input
                className="stripe-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && (
            <div className="stripe-error-callout" style={{ margin: '14px 0' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn primary login-btn stripe-pay-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        <div className="login-hint-box stripe-hint-box">
          <div className="hint-info">
            <span className="hint-label">Demo Credentials:</span>
            <code className="hint-code">admin123</code>
          </div>
          <button type="button" className="btn small hint-btn" onClick={handleUseDefault}>
            Auto-fill Passcode
          </button>
        </div>

        <div className="login-separator"></div>

        <div className="taker-notice stripe-taker-notice">
          <div className="taker-notice-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#635BFF" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div className="taker-notice-content">
            <strong>Taking a survey?</strong>
            <p className="muted small-text">
              Survey respondents do not need an account. Access your specific survey using the unique link provided to you (<code>#/take/&lt;survey-id&gt;</code>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

