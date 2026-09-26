import { useEffect, useState } from 'react';

export default function SurveyPreview({ surveyId, goTo }) {
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/surveys/${surveyId}`)
      .then(r => {
        if (!r.ok) throw new Error('Survey not found.');
        return r.json();
      })
      .then(setSurvey)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading) {
    return (
      <div className="taker-loading-wrap">
        <div className="stripe-loading-skeleton" style={{ maxWidth: '640px', margin: '40px auto' }}>
          <div className="skeleton-bar" style={{ width: '40%' }}></div>
          <div className="skeleton-card" style={{ height: '160px' }}></div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="panel centered stripe-main-panel">
        <div className="error-icon">⚠️</div>
        <h2>Survey Unavailable</h2>
        <p className="error">{error}</p>
        <button className="btn" style={{ marginTop: '16px' }} onClick={() => goTo('home')}>
          ← Back to Surveys
        </button>
      </div>
    );
  }

  return (
    <div className="preview-container stripe-preview-container">
      {/* Stripe Test Mode Banner */}
      <div className="stripe-test-banner">
        <div className="test-banner-left">
          <div className="test-mode-badge">
            <span className="test-badge-dot"></span>
            <span>SIMULATOR MODE</span>
          </div>
          <div className="test-banner-text">
            <strong>Read-Only Survey Preview</strong> · Experience the respondent view exactly as live users will see it. Real submissions are paused.
          </div>
        </div>

        <div className="preview-banner-actions">
          <button className="btn small preview-action-btn" onClick={() => goTo('dashboard', surveyId)}>
            ← Back to Insights
          </button>
          <button className="btn small primary preview-action-btn" onClick={() => goTo('home')}>
            All Surveys
          </button>
        </div>
      </div>

      <div className="panel taker-panel stripe-checkout-panel preview-panel">
        {/* Checkout Header */}
        <div className="taker-checkout-header">
          <div className="checkout-brand-row">
            <div className="checkout-badge-secure">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>PREVIEW SIMULATOR SESSION</span>
            </div>
            <span className="progress-fraction">{survey.questions.length} questions total</span>
          </div>

          <h1 className="taker-survey-title">{survey.title}</h1>
          {survey.description && (
            <p className="taker-survey-desc">{survey.description}</p>
          )}

          <div className="stripe-progress-track">
            <div className="stripe-progress-bar" style={{ width: '40%' }}></div>
          </div>
        </div>

        <div className="taker-questions-list">
          {survey.questions.map((q, idx) => (
            <div className="question-render stripe-question-card" key={q.id}>
              <div className="q-prompt-header">
                <span className="q-number-pill">{idx + 1}</span>
                <label className="q-prompt-text">{q.prompt}</label>
              </div>

              {q.type === 'text' && (
                <div className="text-input-wrap">
                  <textarea
                    rows={3}
                    placeholder="Respondent will type their freeform response here…"
                    disabled
                    className="stripe-input taker-textarea preview-disabled"
                  />
                </div>
              )}

              {q.type === 'mcq' && (
                <div className="mcq-options-grid">
                  {q.options.map(opt => (
                    <label key={opt} className="radio-option stripe-payment-selector preview-disabled-option">
                      <div className="radio-circle"></div>
                      <input type="radio" name={q.id} disabled style={{ display: 'none' }} />
                      <span className="radio-label-text">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'nps' && (
                <div className="nps-scale-wrapper">
                  <div className="nps-scale">
                    {Array.from({ length: 11 }, (_, i) => i).map(n => (
                      <button
                        key={n}
                        type="button"
                        className="nps-btn stripe-nps-tile preview-disabled-btn"
                        disabled
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="nps-labels">
                    <span className="nps-label-left">0 — Not at all likely</span>
                    <span className="nps-label-right">10 — Extremely likely</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="taker-footer stripe-checkout-footer preview-footer">
          <button className="btn primary taker-submit-btn stripe-pay-btn" disabled>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
            <span>Submit Feedback (Preview Disabled)</span>
          </button>
          <span className="preview-disabled-note">
            ⚠️ Live submissions are disabled in simulator mode
          </span>
        </div>
      </div>
    </div>
  );
}

