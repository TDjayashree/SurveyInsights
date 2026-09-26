# Survey Insights Platform

A mini, full-stack version of SurveySparrow's core loop:
**Surveys → Case Management → Business Intelligence**

Built with React (Vite) on the frontend and Node.js/Express + SQLite on the backend.

## Architecture: Surveyor (Admin) vs. Survey Taker

The platform separates the **Surveyor** (administrative portal) from the **Survey Taker** (public respondent view):

- **Survey Taker (Public)**
  - Accesses surveys exclusively via shareable links (e.g. `#/take/<survey-id>`).
  - Isolated respondent interface without administrative headers, "Back to home" links, or dashboard access.
  - Can only view survey questions and submit anonymous responses.
  - Submissions are accepted without requiring authentication.
- **Surveyor (Admin Portal)**
  - Access to survey creation, survey listing, deletion, BI dashboards, and case management is restricted to surveyors.
  - Protected by passcode authentication (default demo passcode: `admin123`).
  - Backend endpoints (`/api/surveys`, `/insights`, `/cases`) enforce admin authorization tokens.
  - Unauthenticated users attempting to navigate to dashboard or admin routes are directed to the Surveyor Portal login.

## Features

- **Survey Builder** — create surveys with three question types: open text, multiple choice, and NPS (0–10 scale)
- **Dedicated Survey Taker Form** — distraction-free public response form with no links to admin results
- **BI Dashboard** — auto-calculated NPS score, response distributions, MCQ breakdowns (pie charts), text response samples, responses-over-time line chart
- **Case Management** — any response with an NPS score of 6 or below is automatically flagged as an open "case," which you can view and mark resolved — mirroring SurveySparrow's real case-management pillar

## Project structure

```
survey-insights-platform/
├── backend/
│   ├── server.js         # Express app entry point
│   ├── auth.js           # Admin authentication middleware
│   ├── db.js             # SQLite schema (better-sqlite3)
│   └── routes/
│       ├── auth.js       # Admin passcode verification
│       ├── surveys.js    # create/list/get/delete surveys (admin-protected)
│       └── responses.js  # public submit responses, admin insights & cases
└── frontend/
    ├── vite.config.js    # dev server + /api proxy to backend
    └── src/
        ├── App.jsx               # hash-based router with role-based view separation
        ├── api.js                # frontend auth token helper
        └── components/
            ├── AdminLogin.jsx    # Surveyor passcode entry gate
            ├── Home.jsx          # survey list & management
            ├── SurveyBuilder.jsx # create surveys
            ├── SurveyForm.jsx    # public response form (taker view)
            └── Dashboard.jsx     # BI charts + case management tabs
```

## Running it locally

You need two terminals (backend + frontend).

**Terminal 1 — backend:**
```bash
cd backend
npm install
node server.js
# API runs on http://localhost:4000
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies `/api/*` requests to the backend automatically (see `vite.config.js`), so you only ever need to open the frontend URL.

## How to demo it

1. Open `http://localhost:5173`. If prompted, sign into the Surveyor Portal using the demo passcode `admin123`.
2. Create or select a survey (e.g. "Customer Satisfaction Q3") with an NPS question, an MCQ question, and a text question.
3. In the Dashboard or Surveys list, click **"Copy Taker Link"** or **"Copy Survey Link"**.
4. Open an Incognito window (or a separate tab/browser) and paste the link (`http://localhost:5173/#/take/<id>`).
5. Notice that as a **Survey Taker**:
   - You only see the clean survey form.
   - There is **no header link to home**, **no "← Back" button**, and **no access to the dashboard or BI analytics**.
   - Fill out and submit the survey. The completion screen confirms your response without any link back to the dashboard.
   - If the survey taker tries to manually change the URL to `#/home` or `#/dashboard/...`, they are stopped by the Surveyor Passcode gate.
6. Switch back to your Surveyor window: refresh the Dashboard to view the new response in the BI charts and Case Management.
