# NextFolio

NextFolio is a full-stack resume, portfolio, and AI career agent platform. It helps users turn resume data into an editable profile, generate ATS-friendly resumes and portfolio previews, publish local portfolio links, discover matching jobs, track applications, prepare for interviews, compare offers, and build a personalized skills roadmap through the Knowledge Map.

Live deployment: https://next-folio-silk.vercel.app/

## Core Modules

- Resume and portfolio builder with authenticated profile storage.
- Resume upload, parsing, ATS scoring, keyword matching, and bio optimization.
- Real-time resume and portfolio previews with modern, minimal, and CLI-style presentation paths.
- PDF export for ATS-friendly resumes.
- Local portfolio publishing at `/portfolio/:slug`.
- AI Career Agent workspace at `/career-agent`.
- Knowledge Map workspace at `/knowledge-map`.
- Multi-agent backend orchestration for resume intelligence, job discovery, matching, applications, interviews, notifications, offer analysis, and learning roadmaps.

## AI Career Agent

The Career Agent is a dashboard-driven job search assistant with tabs for:

- Dashboard metrics for applications, interviews, offers, and success rate.
- Resume Intelligence for candidate profile analysis, ATS score, missing skills, and recommendations.
- Job Discovery using real remote job APIs through the backend agent layer.
- Job Matches with candidate-to-role scoring.
- Auto Apply settings and application submission flow.
- Application tracking with status updates and outreach generation.
- Interview Prep, mock interview chat, live interview studio sessions, transcripts, scoring, and analytics.
- Notifications for agent activity.
- Offer Analysis for compensation and benefits decisions.
- Agent Settings for roles, locations, thresholds, and preferences.

## Knowledge Map

The Knowledge Map is an AI learning companion for career growth:

- Extracts skills from the user profile.
- Visualizes skills as an interactive graph.
- Tracks mastery, status, prerequisites, and career importance.
- Generates role-based learning roadmaps.
- Detects skill gaps for target roles.
- Creates daily learning plans with XP, streaks, and progress tracking.
- Provides an AI mentor chat and curated learning resources.

## Tech Stack

### Frontend

| Area | Technology |
| --- | --- |
| App framework | React 19, Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 3, custom CSS |
| State | Zustand |
| Forms | React Hook Form |
| Icons | Lucide React |
| Google auth UI | `@react-oauth/google` |

### Backend

| Area | Technology |
| --- | --- |
| Runtime | Node.js with ESM |
| API | Express 4 |
| Database | SQLite with Sequelize |
| Auth | JWT, bcryptjs, Google userinfo API |
| Uploads | Multer, pdf-parse |
| PDF export | Puppeteer |
| OTP email | Resend API |
| AI provider | OpenAI SDK, with local fallback behavior in several flows |
| Serverless entry | `api/index.mjs` forwarding to `server/server.js` |

### Python Helpers

| File | Purpose |
| --- | --- |
| `server/services/ai_parser.py` | Resume section extraction and normalization |
| `server/services/ats_scorer.py` | ATS score and recommendations |
| `server/services/keyword_optimizer.py` | Missing keyword analysis |
| `server/services/bio_optimizer.py` | Professional summary optimization |
| `server/services/speaksmart_analyzer.py` | Interview communication analysis helper |

## Project Structure

```text
NextFolio/
|-- api/
|   `-- index.mjs                    # Vercel serverless entry
|-- client/
|   |-- public/                      # Static and CLI portfolio assets
|   |-- src/
|   |   |-- components/              # Shared UI primitives and modals
|   |   |-- features/                # Builder, previews, themes, Career Agent UI
|   |   |-- layouts/                 # Main, Career Agent, and Knowledge Map layouts
|   |   |-- lib/                     # API, Google auth, build helpers
|   |   |-- pages/                   # App pages and routed workspaces
|   |   |-- store/                   # Zustand stores
|   |   `-- main.jsx
|   `-- package.json
|-- server/
|   |-- agents/                      # Multi-agent career and learning orchestration
|   |-- models/                      # Sequelize models and relationships
|   |-- routes/                      # Auth, resume, AI, upload, career, knowledge APIs
|   |-- services/                    # JS services and Python helpers
|   |-- database.sqlite              # Local SQLite database
|   |-- server.js                    # Express app and serverless handler
|   `-- package.json
|-- vercel.json                      # Vercel build and rewrite config
|-- package.json                     # Root dependency metadata
`-- README.md
```

## Prerequisites

- Node.js 18 or newer.
- npm.
- Python 3 available as `python` on your PATH.
- Internet access for live job discovery from Remotive and Arbeitnow.
- Optional Google OAuth credentials for Google login.
- Optional OpenAI API key for stronger AI text generation.
- Optional Resend API key and verified sender for production OTP email.

## Environment Variables

Environment files are intentionally ignored by git.

### Server: `server/.env`

```env
PORT=5000
JWT_SECRET=replace_with_a_strong_secret
OPENAI_API_KEY=optional_openai_key
RESEND_API_KEY=optional_resend_key
OTP_FROM_EMAIL=onboarding@resend.dev
```

Notes:

- `JWT_SECRET` has a development fallback, but production should always provide a real secret.
- If Resend is not configured outside production, OTP codes are logged to the server console.
- `OPENAI_API_KEY` is optional. Several flows still provide heuristic/local fallback behavior.

### Client: `client/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_ENABLE_GOOGLE_LOGIN=false
VITE_APP_VERSION=local
```

Notes:

- `VITE_API_URL` may be either `http://localhost:5000` or `http://localhost:5000/api`; the client normalizes it.
- Google login is active only when `VITE_ENABLE_GOOGLE_LOGIN=true` and `VITE_GOOGLE_CLIENT_ID` is configured.
- For local Google login, add `http://localhost:5173` and `http://127.0.0.1:5173` as Authorized JavaScript origins in Google Cloud Console.

## Local Setup

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Run the backend:

```bash
cd server
npm run dev
```

Run the frontend in another terminal:

```bash
cd client
npm run dev
```

Open http://localhost:5173.

## Available Scripts

### Client

```bash
cd client
npm run dev       # Start Vite
npm run build     # Build production frontend
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Server

```bash
cd server
npm start         # Start Express
npm run dev       # Start Express in development
```

## Main Routes

### Frontend

| Route | Purpose |
| --- | --- |
| `/` | Resume and portfolio builder |
| `/career-agent` | AI Career Agent workspace |
| `/knowledge-map` | Skill graph, roadmaps, and learning mentor |
| `/portfolio/:slug` | Published local portfolio view |
| `/login` | Login and signup |
| `/about` | About page |
| `/contact` | Contact page |

### Backend API

All API routes are mounted under `/api`.

| Base Route | Purpose |
| --- | --- |
| `/api/auth` | Signup, login, OTP, and Google auth |
| `/api/resume` | Authenticated resume profile, config, experience, education, projects, and skills |
| `/api/ai` | Resume parsing, ATS scoring, keyword optimization, and bio optimization |
| `/api/upload` | Alternate resume upload and save flow |
| `/api/generate` | ATS resume PDF generation |
| `/api/career-agents/resume` | Candidate profile and resume intelligence |
| `/api/career-agents/jobs` | Job discovery and job listing |
| `/api/career-agents/matches` | Job matching |
| `/api/career-agents/applications` | Apply, track status, and outreach |
| `/api/career-agents/settings` | Auto-apply and agent preferences |
| `/api/career-agents/interviews` | Interview prep, mock chat, studio sessions, transcripts, and analytics |
| `/api/career-agents/offers` | Offer analysis and offer status |
| `/api/career-agents/notifications` | Agent notifications |
| `/api/knowledge-map` | Skills, roadmaps, daily plans, mentor chat, and resources |

Authenticated requests use:

```http
Authorization: Bearer <token>
```

## Database

The app uses local SQLite through Sequelize. The database file is:

```text
server/database.sqlite
```

The schema includes original resume builder tables plus Career Agent and Knowledge Map tables such as candidate profiles, jobs, matches, applications, agent settings, notifications, offers, interview prep, interview sessions, transcripts, analytics, skill nodes, roadmaps, daily plans, and learning resources.

SQLite runtime sidecars such as `*.sqlite-wal` and `*.sqlite-shm` are ignored and should not be committed.

## Deployment

The root `vercel.json` config:

- Installs root, client, and server dependencies.
- Builds the frontend from `client`.
- Serves `client/dist`.
- Rewrites `/api/*` to the serverless Express handler in `api/index.mjs`.
- Rewrites all other routes to the frontend app.

Set production secrets in Vercel instead of committing them. At minimum, configure `JWT_SECRET`, `VITE_API_URL`, and any Google OAuth, OpenAI, or Resend values used by the deployment.

## Development Notes

- `node_modules`, `client/dist`, Python caches, and SQLite sidecar files are generated and ignored.
- The server initializes the agent orchestrator on startup.
- Job discovery currently uses Remotive first and Arbeitnow as backup.
- Portfolio publish links are local/browser based unless a persistent hosted publish flow is added.
- Some AI features use deterministic fallback behavior when external AI credentials are missing.
- The root `package.json` is dependency metadata; day-to-day development scripts live in `client/package.json` and `server/package.json`.

## Additional Documentation

- `ARCHITECTURE.md`
- `DEPLOYMENT_GUIDE.md`
- `DOCUMENTATION_INDEX.md`
- `COMPLETION_SUMMARY.md`
- `AI_CAREER_AGENT_PLAN.md`
- `PHASE_1_COMPLETION_SUMMARY.md`
- `PHASE_2_IMPLEMENTATION.md`
- `PHASE_2_COMPLETION.md`
- `PHASE_2_QUICK_START.md`
- `PHASE_2_TO_3_TRANSITION.md`
- `STATUS_DASHBOARD.md`
- `client/src/COMPONENT_GUIDE.md`
- `client/src/STYLING_GUIDE.md`
