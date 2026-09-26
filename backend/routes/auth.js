const express = require('express');
const { ADMIN_PASSWORD, requireAdmin } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.json({ ok: true, token: ADMIN_PASSWORD, role: 'admin' });
  }
  return res.status(401).json({ error: 'Incorrect admin passcode' });
});

router.get('/verify', requireAdmin, (req, res) => {
  res.json({ ok: true, role: 'admin' });
});

module.exports = router;
