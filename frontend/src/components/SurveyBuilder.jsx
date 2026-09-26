import { useState } from 'react';
import { adminFetch } from '../api';

const emptyQuestion = () => ({ type: 'text', prompt: '', options: ['', ''] });

export default function SurveyBuilder({ goTo }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateQuestion = (idx, patch) => {
    setQuestions(qs => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[optIdx] = value;
      return { ...q, options };
    }));
  };

  const addOption = (qIdx) => {
    setQuestions(qs => qs.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ''] } : q)));
  };

  const removeOption = (qIdx, optIdx) => {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const options = q.options.filter((_, idx) => idx !== optIdx);
      return { ...q, options: options.length ? options : [''] };
    }));
  };

  const addQuestion = () => setQuestions(qs => [...qs, emptyQuestion()]);
  const removeQuestion = (idx) => setQuestions(qs => qs.filter((_, i) => i !== idx));

  const submit = async () => {
    setError('');
    if (!title.trim()) return setError('Please provide a survey title.');
    if (questions.some(q => !q.prompt.trim())) return setError('Every question prompt must be filled out.');

    const payload = {
      title,
      description,
      questions: questions.map(q => ({
        type: q.type,
        prompt: q.prompt,
        options: q.type === 'mcq' ? q.options.filter(o => o.trim()) : undefined,
      })),
    };

    setSaving(true);
    try {
      const res = await adminFetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save survey');
      goTo('dashboard', data.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stripe-page-container">
      {/* Navigation Breadcrumb */}
      <div className="dashboard-nav-header">
        <div className="breadcrumbs">
          <span className="crumb-link" onClick={() => goTo('home')}>Surveys</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">New Survey</span>
          <span className="draft-status-pill">
            <span className="draft-dot"></span> Draft Mode
          </span>
        </div>

        <button className="btn small" onClick={() => goTo('home')}>
          ← Back to Surveys
        </button>
      </div>

      <div className="panel stripe-main-panel">
        <div className="panel-header-row">
          <div>
            <div className="section-eyebrow">SCHEMA DESIGNER</div>
            <h2 className="section-heading">Create Survey & Telemetry Form</h2>
            <p className="muted">
              Define questions, prompt formats, and rating scales. Deployed surveys receive instant shareable respondent links.
            </p>
          </div>
        </div>

        {/* Survey Metadata Section */}
        <div className="builder-section">
          <div className="field-group">
            <label className="field">
              <span className="field-label">SURVEY TITLE</span>
              <input
                className="stripe-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Q3 Customer Satisfaction & Platform Experience (CSAT)"
                autoFocus
              />
              <span className="field-hint">This title is displayed to respondents at the top of the survey.</span>
            </label>

            <label className="field">
              <span className="field-label">DESCRIPTION (OPTIONAL)</span>
              <textarea
                className="stripe-input"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Help us improve our product workflows. Takes less than 2 minutes."
              />
            </label>
          </div>
        </div>

        {/* Questions Builder Section */}
        <div className="builder-questions-section">
          <div className="questions-section-header">
            <div>
              <h3 className="subheading">Questions & Input Types</h3>
              <p className="muted small-text">Configure prompts, answer types, and scoring logic.</p>
            </div>
            <span className="questions-count-pill">{questions.length} Question{questions.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="questions-list">
            {questions.map((q, idx) => (
              <div className="question-editor stripe-editor-card" key={idx}>
                <div className="question-card-topbar">
                  <div className="question-number-badge">
                    <span>Q{idx + 1}</span>
                  </div>

                  {/* Question Type Segmented Selector */}
                  <div className="type-segmented-control">
                    <button
                      type="button"
                      className={`type-tab ${q.type === 'text' ? 'active' : ''}`}
                      onClick={() => updateQuestion(idx, { type: 'text' })}
                    >
                      <span className="type-icon">📝</span>
                      <span>Open Text</span>
                    </button>
                    <button
                      type="button"
                      className={`type-tab ${q.type === 'mcq' ? 'active' : ''}`}
                      onClick={() => updateQuestion(idx, { type: 'mcq', options: q.options?.length ? q.options : ['', ''] })}
                    >
                      <span className="type-icon">🔘</span>
                      <span>Multiple Choice</span>
                    </button>
                    <button
                      type="button"
                      className={`type-tab ${q.type === 'nps' ? 'active' : ''}`}
                      onClick={() => updateQuestion(idx, { type: 'nps' })}
                    >
                      <span className="type-icon">⭐</span>
                      <span>NPS (0–10)</span>
                    </button>
                  </div>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="btn danger small icon-only-btn remove-q-btn"
                      title="Delete question"
                      onClick={() => removeQuestion(idx)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>

                <div className="question-body">
                  <label className="field">
                    <span className="field-label">QUESTION PROMPT</span>
                    <input
                      className="prompt-input stripe-input"
                      placeholder={
                        q.type === 'nps'
                          ? 'e.g. How likely are you to recommend our platform to a colleague or partner?'
                          : q.type === 'mcq'
                          ? 'e.g. Which pricing tier best fits your organization?'
                          : 'e.g. What is the single biggest feature you would like to see us build?'
                      }
                      value={q.prompt}
                      onChange={e => updateQuestion(idx, { prompt: e.target.value })}
                    />
                  </label>

                  {q.type === 'mcq' && (
                    <div className="options-editor stripe-options-editor">
                      <span className="field-label">MULTIPLE CHOICE OPTIONS</span>
                      <div className="options-inputs-list">
                        {q.options.map((opt, oIdx) => (
                          <div className="option-row" key={oIdx}>
                            <span className="option-index">{String.fromCharCode(65 + oIdx)}</span>
                            <input
                              className="stripe-input"
                              placeholder={`Option ${oIdx + 1}`}
                              value={opt}
                              onChange={e => updateOption(idx, oIdx, e.target.value)}
                            />
                            {q.options.length > 1 && (
                              <button
                                type="button"
                                className="option-delete-btn"
                                onClick={() => removeOption(idx, oIdx)}
                                title="Remove option"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn small add-option-btn"
                        onClick={() => addOption(idx)}
                      >
                        + Add Choice Option
                      </button>
                    </div>
                  )}

                  {q.type === 'nps' && (
                    <div className="nps-preview-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#635BFF" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <span>
                        Automatic NPS Scale: Renders interactive 0 to 10 rating scale for respondents. Ratings of 0–6 automatically trigger <strong>Radar Escalation Cases</strong>.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="add-question-dashed-btn" onClick={addQuestion}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Another Question</span>
          </button>
        </div>

        {error && (
          <div className="stripe-error-callout" style={{ marginTop: '20px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="panel-footer-actions">
          <button className="btn" type="button" onClick={() => goTo('home')}>
            Cancel
          </button>
          <button
            className="btn primary stripe-hero-btn"
            disabled={saving}
            onClick={submit}
          >
            {saving ? (
              <>
                <span className="btn-spinner"></span>
                <span>Deploying Survey…</span>
              </>
            ) : (
              <>
                <span>Publish Survey</span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

