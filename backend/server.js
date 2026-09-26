const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const surveysRouter = require('./routes/surveys');
const responsesRouter = require('./routes/responses');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/surveys', surveysRouter);
app.use('/api', responsesRouter); // handles /api/surveys/:id/responses, /insights, /cases

app.listen(PORT, () => {
  console.log(`Survey Insights API running on http://localhost:${PORT}`);
});
