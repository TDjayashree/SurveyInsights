const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

// Create a survey with its questions (admin only)
// body: { title, description, questions: [{ type, prompt, options? }] }
router.post('/', requireAdmin, (req, res) => {
  const { title, description, questions } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'title and at least one question are required' });
  }

  const surveyId = nanoid(10);
  const insertSurvey = db.prepare(
    `INSERT INTO surveys (id, title, description) VALUES (?, ?, ?)`
  );
  const insertQuestion = db.prepare(
    `INSERT INTO questions (id, survey_id, type, prompt, options, order_index) VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    insertSurvey.run(surveyId, title, description || '');
    questions.forEach((q, idx) => {
      if (!q.prompt || !q.type) throw new Error('Each question needs a type and prompt');
      insertQuestion.run(
        nanoid(10),
        surveyId,
        q.type,
        q.prompt,
        q.options ? JSON.stringify(q.options) : null,
        idx
      );
    });
  });

  try {
    tx();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  res.status(201).json({ id: surveyId });
});

// List all surveys (summary, for dashboard/home - admin only)
router.get('/', requireAdmin, (req, res) => {
  const surveys = db.prepare(`
    SELECT s.id, s.title, s.description, s.created_at,
      (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count
    FROM surveys s ORDER BY s.created_at DESC
  `).all();
  res.json(surveys);
});

// Get a single survey with its questions (PUBLIC: for survey takers to load questions)
router.get('/:id', (req, res) => {
  const survey = db.prepare(`SELECT * FROM surveys WHERE id = ?`).get(req.params.id);
  if (!survey) return res.status(404).json({ error: 'Survey not found' });

  const questions = db.prepare(
    `SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC`
  ).all(req.params.id).map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null,
  }));

  res.json({ ...survey, questions });
});

// Delete survey (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM surveys WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
