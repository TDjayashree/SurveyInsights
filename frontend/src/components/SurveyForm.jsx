import { useEffect, useState } from 'react';

export default function SurveyForm({ surveyId }) {
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/surveys/${surveyId}`)
      .then(r => {
        if (!r.ok) throw new Error('Survey not found or no longer active.');
        return r.json();
      })
      .then(setSurvey)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [surveyId]);

  const setAnswer = (questionId, value) => setAnswers(a => ({ ...a, [questionId]: value }));

  const submit = async () => {
    setError('');
    const payload = {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
    };
    if (payload.answers.length === 0) return setError('Please answer at least one question before submitting.');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Something went wrong submitting your response.');
      setSubmitted(true);
    } catch (e) {
      setError(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAnswers({});
    setSubmitted(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="taker-loading-wrap">
        <div className="stripe-loading-skeleton" style={{ maxWidth: '640px', margin: '40px auto' }}>
          <div className="skeleton-bar" style={{ width: '50%', height: '24px' }}></div>
          <div className="skeleton-card" style={{ height: '180px' }}></div>
          <div className="skeleton-card" style={{ height: '180px' }}></div>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="panel centered taker-error-panel stripe-checkout-panel">
        <div className="error-icon">⚠️</div>
        <h2>Survey Unavailable</h2>
        <p className="error">{error}</p>
      </div>
    );
  }

  // Completion percentage
  const totalQuestions = survey?.questions?.length || 1;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  const percentComplete = Math.round((answeredCount / totalQuestions) * 100);

  if (submitted) {
    return (
      <div className="taker-container">
        <div className="panel taker-panel stripe-checkout-panel taker-success-panel">
          <div className="stripe-success-circle">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00D4B2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h2 className="success-headline">Thank you for your feedback</h2>
          <p className="muted success-sub">
            Your response has been securely transmitted and recorded into our telemetry engine.
          </p>

          <div className="receipt-meta-box">
            <div className="receipt-row">
              <span className="receipt-label">Survey</span>
              <span className="receipt-val">{survey.title}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Status</span>
              <span className="receipt-val badge-success">✓ Verified & Recorded</span>
            </div>
          </div>

          <div className="thankyou-actions">
            <button className="btn stripe-secondary-btn" onClick={resetForm}>
              Submit Another Response
            </button>
          </div>

          <div className="taker-powered-seal">
            <span>Powered by <strong>Survey Insights</strong> Platform</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="taker-container">
      <div className="panel taker-panel stripe-checkout-panel">
        {/* Checkout Header */}
        <div className="taker-checkout-header">
          <div className="checkout-brand-row">
            <div className="checkout-badge-secure">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>SECURE RESPONSE SESSION</span>
            </div>
            <span className="progress-fraction">{answeredCount} of {totalQuestions} answered</span>
          </div>

          <h1 className="taker-survey-title">{survey.title}</h1>
          {survey.description && (
            <p className="taker-survey-desc">{survey.description}</p>
          )}

          {/* Stripe Progress Track */}
          <div className="stripe-progress-track">
            <div className="stripe-progress-bar" style={{ width: `${percentComplete}%` }}></div>
          </div>
        </div>

        {/* Survey Questions */}
        <div className="taker-questions-list">
          {survey.questions.map((q, idx) => (
            <div className="question-render stripe-question-card" key={q.id}>
              <div className="q-prompt-header">
                <span className="q-number-pill">{idx + 1}</span>
                <label className="q-prompt-text">{q.prompt}</label>
              </div>

              {/* Text Input */}
              {q.type === 'text' && (
                <div className="text-input-wrap">
                  <textarea
                    className="stripe-input taker-textarea"
                    rows={3}
                    placeholder="Enter your thoughts or feedback here…"
                    value={answers[q.id] || ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                  />
                </div>
              )}

              {/* MCQ: Styled like Stripe Payment method selectors */}
              {q.type === 'mcq' && (
                <div className="mcq-options-grid">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <label
                        key={opt}
                        className={`radio-option stripe-payment-selector ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="radio-circle">
                          {isSelected && <div className="radio-inner-dot"></div>}
                        </div>
                        <input
                          type="radio"
                          name={q.id}
                          checked={isSelected}
                          onChange={() => setAnswer(q.id, opt)}
                          style={{ display: 'none' }}
                        />
                        <span className="radio-label-text">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* NPS: 0 to 10 rating pill buttons */}
              {q.type === 'nps' && (
                <div className="nps-scale-wrapper">
                  <div className="nps-scale">
                    {Array.from({ length: 11 }, (_, i) => i).map(n => {
                      const isSelected = String(answers[q.id]) === String(n);
                      return (
                        <button
                          key={n}
                          type="button"
                          className={`nps-btn stripe-nps-tile ${isSelected ? 'selected' : ''}`}
                          onClick={() => setAnswer(q.id, n)}
                        >
                          {n}
                        </button>
                      );
                    })}
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

        {error && (
          <div className="stripe-error-callout" style={{ marginTop: '24px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Bar styled like Stripe Checkout Pay button */}
        <div className="taker-footer stripe-checkout-footer">
          <button
            type="button"
            className="btn primary taker-submit-btn stripe-pay-btn"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                <span>Submitting Feedback…</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                <span>Submit Feedback</span>
              </>
            )}
          </button>

          <div className="checkout-trust-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#697386" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Anonymous & Encrypted Response</span>
          </div>
        </div>
      </div>
    </div>
  );
}

