const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

// Submit a response to a survey
// body: { answers: [{ questionId, value }] }
router.post('/surveys/:surveyId/responses', (req, res) => {
  const { surveyId } = req.params;
  const { answers } = req.body;

  const survey = db.prepare(`SELECT * FROM surveys WHERE id = ?`).get(surveyId);
  if (!survey) return res.status(404).json({ error: 'Survey not found' });
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers are required' });
  }

  const questions = db.prepare(`SELECT * FROM questions WHERE survey_id = ?`).all(surveyId);
  const questionMap = Object.fromEntries(questions.map(q => [q.id, q]));

  const responseId = nanoid(10);
  const insertResponse = db.prepare(`INSERT INTO responses (id, survey_id) VALUES (?, ?)`);
  const insertAnswer = db.prepare(
    `INSERT INTO answers (id, response_id, question_id, value) VALUES (?, ?, ?, ?)`
  );
  const insertCase = db.prepare(
    `INSERT INTO cases (id, survey_id, response_id, reason) VALUES (?, ?, ?, ?)`
  );

  const casesToCreate = [];

  const tx = db.transaction(() => {
    insertResponse.run(responseId, surveyId);
    answers.forEach(a => {
      const q = questionMap[a.questionId];
      if (!q) return; // ignore unknown question ids
      insertAnswer.run(nanoid(10), responseId, a.questionId, String(a.value));

      // Case management: auto-flag detractors (NPS <= 6) as open cases
      if (q.type === 'nps' && Number(a.value) <= 6 && a.value !== '' ) {
        casesToCreate.push(`Low NPS score (${a.value}/10) on "${q.prompt}"`);
      }
    });
  });

  tx();

  // Create at most one case per response to avoid noise, combining reasons
  if (casesToCreate.length > 0) {
    insertCase.run(nanoid(10), surveyId, responseId, casesToCreate.join('; '));
  }

  res.status(201).json({ id: responseId, flagged: casesToCreate.length > 0 });
});

// Insights/BI dashboard data for a survey (admin only)
router.get('/surveys/:surveyId/insights', requireAdmin, (req, res) => {
  const { surveyId } = req.params;
  const survey = db.prepare(`SELECT * FROM surveys WHERE id = ?`).get(surveyId);
  if (!survey) return res.status(404).json({ error: 'Survey not found' });

  const questions = db.prepare(
    `SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC`
  ).all(surveyId).map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : null }));

  const totalResponses = db.prepare(
    `SELECT COUNT(*) as c FROM responses WHERE survey_id = ?`
  ).get(surveyId).c;

  // Responses over time (grouped by date)
  const overTime = db.prepare(`
    SELECT date(submitted_at) as day, COUNT(*) as count
    FROM responses WHERE survey_id = ?
    GROUP BY day ORDER BY day ASC
  `).all(surveyId);

  const perQuestion = questions.map(q => {
    const answers = db.prepare(
      `SELECT value FROM answers WHERE question_id = ?`
    ).all(q.id).map(a => a.value);

    if (q.type === 'nps') {
      const nums = answers.map(Number).filter(n => !isNaN(n));
      const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : null;
      const distribution = Array.from({ length: 11 }, (_, score) => ({
        score,
        count: nums.filter(n => n === score).length,
      }));
      const promoters = nums.filter(n => n >= 9).length;
      const detractors = nums.filter(n => n <= 6).length;
      const npsScore = nums.length
        ? Math.round(((promoters - detractors) / nums.length) * 100)
        : null;
      return { id: q.id, type: q.type, prompt: q.prompt, avg, distribution, npsScore, count: nums.length };
    }

    if (q.type === 'mcq') {
      const counts = {};
      (q.options || []).forEach(opt => { counts[opt] = 0; });
      answers.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
      return { id: q.id, type: q.type, prompt: q.prompt, counts, count: answers.length };
    }

    // text
    return { id: q.id, type: q.type, prompt: q.prompt, samples: answers.slice(-10).reverse(), count: answers.length };
  });

  res.json({ survey, totalResponses, overTime, perQuestion });
});

// List cases for a survey (admin only)
router.get('/surveys/:surveyId/cases', requireAdmin, (req, res) => {
  const cases = db.prepare(`
    SELECT * FROM cases WHERE survey_id = ? ORDER BY created_at DESC
  `).all(req.params.surveyId);
  res.json(cases);
});

// Update a case's status (admin only)
router.patch('/cases/:caseId', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['open', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'status must be open or resolved' });
  }
  db.prepare(`UPDATE cases SET status = ? WHERE id = ?`).run(status, req.params.caseId);
  res.json({ ok: true });
});

module.exports = router;
