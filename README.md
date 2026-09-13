# NextFolio

NextFolio is a full-stack resume, portfolio, and AI career platform. Users can build and publish a portfolio, generate ATS-friendly resumes, analyze job descriptions, discover and track applications, prepare for interviews, compare offers, and follow a personalized skills roadmap.

Live application: https://next-folio-silk.vercel.app/

## Features

### Resume and portfolio builder

- Edit personal details, experience, education, projects, and skills.
- Upload and parse resumes from PDF files.
- Score resumes for ATS compatibility and optimize keywords and bios.
- Preview resumes and portfolios in multiple presentation styles.
- Generate ATS-friendly PDF resumes.
- Publish portfolio pages at `/portfolio/:slug`.

### AI Career Agent

The authenticated Career Agent workspace at `/career-agent` includes:

- Candidate profile and resume intelligence analysis.
- Job discovery from Remotive and Arbeitnow.
- Job matching, application tracking, and outreach generation.
- Configurable auto-apply and agent preferences.
- Interview preparation, mock interview chat, interview studio sessions, transcripts, scoring, and analytics.
- Email-sync simulation and notification workflows.
- Offer analysis and status tracking.

### Knowledge Map

The authenticated Knowledge Map workspace at `/knowledge-map` provides:

- Skill extraction and an interactive skill graph.
- Skill mastery, prerequisites, and career importance tracking.
- Role-based learning roadmaps and skill-gap analysis.
- Daily learning plans, XP, streaks, and task completion.
- AI mentor chat and curated learning resources.

## Architecture

NextFolio contains a production-oriented Express path and an optional Python orchestration path:

```text
Browser
  |
  v
React 19 + Vite client
  |
  +--> Express API (Node.js, SQLite, Sequelize)
  |      |
  |      +--> Resume, auth, AI, upload, PDF, Career Agent, Knowledge Map routes
  |      +--> JavaScript agent orchestrator
  |
  +--> Optional FastAPI platform
         |
         +--> Celery + Redis for background orchestration
         +--> PostgreSQL for durable relational data
         +--> Qdrant + SentenceTransformers for RAG
         +--> WebSocket progress streaming and Prometheus metrics
```

The root Vercel deployment builds the React client and exposes the Express API through `api/index.mjs`. The FastAPI service is a separate local or containerized deployment under `server/fastapi_server` and is not started by the root Vercel configuration.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7 |
| Styling | Tailwind CSS, custom CSS |
| Client state | Zustand |
| Forms and icons | React Hook Form, Lucide React |
| Node API | Express 4, Node.js ESM |
| Node persistence | SQLite, Sequelize |
| Authentication | JWT, bcryptjs, Google OAuth access tokens |
| Resume processing | Multer, pdf-parse, Puppeteer |
| AI integrations | OpenAI SDK and deterministic local fallbacks |
| Python API | FastAPI, Uvicorn, Pydantic, SQLAlchemy |
| Background jobs | Celery and Redis |
| Vector search | Qdrant and SentenceTransformers |
| Observability | Prometheus metrics and OpenTelemetry |

## Repository Structure

```text
NextFolio/
|-- api/index.mjs                    # Vercel serverless entry point
|-- client/
|   |-- public/                       # Static and CLI portfolio assets
|   |-- src/
|   |   |-- components/               # Shared UI components and modals
|   |   |-- features/                 # Feature-specific UI modules
|   |   |-- layouts/                  # Main, Career Agent, and Knowledge Map layouts
|   |   |-- lib/                      # API and Google OAuth helpers
|   |   |-- pages/                    # Routed application pages
|   |   `-- store/                    # Zustand stores
|   |-- package.json
|   |-- QUICK_START.md
|   `-- vite.config.js
|-- server/
|   |-- agents/                       # JavaScript multi-agent orchestration
|   |-- models/                       # Sequelize models and relationships
|   |-- routes/                       # Express API route modules
|   |-- services/                     # Node services and Python helpers
|   |-- fastapi_server/               # Optional Python orchestration platform
|   |-- database.sqlite               # Local Express database
|   |-- server.js                     # Express app and serverless handler
|   `-- package.json
|-- vercel.json                       # Root Vercel build and rewrite configuration
|-- package.json                      # Root dependency metadata
`-- README.md
```

## Prerequisites

- Node.js 18 or newer and npm.
- Python 3.12 or newer for the FastAPI service.
- Docker Desktop for the FastAPI dependency stack.
- Internet access for job discovery and optional external AI services.

## Local Express Development

Install the Node dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Create `server/.env`:

```env
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
OPENAI_API_KEY=optional_openai_key
RESEND_API_KEY=optional_resend_key
OTP_FROM_EMAIL=onboarding@resend.dev
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_ENABLE_GOOGLE_LOGIN=false
VITE_APP_VERSION=local
```

Start the API in one terminal:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173.

The Express server creates or updates `server/database.sqlite` through Sequelize. When Resend is not configured outside production, OTP codes are logged to the server console. AI features can use deterministic fallback behavior when `OPENAI_API_KEY` is absent.

## Optional FastAPI Platform

The FastAPI service adds asynchronous orchestration, agent routing, RAG endpoints, WebSocket progress streaming, metrics, and a Celery worker. The easiest way to run its dependencies is Docker Compose:

```bash
cd server/fastapi_server
docker compose up --build
```

This starts:

| Service | Address | Purpose |
| --- | --- | --- |
| FastAPI | http://localhost:8000 | Python API |
| PostgreSQL | localhost:5432 | Relational persistence |
| Redis | localhost:6379 | Cache, pub/sub, and Celery broker |
| Qdrant | http://localhost:6333 | Vector database |
| Celery worker | internal | Background orchestration jobs |

Useful endpoints include:

- `GET /api/health`
- `POST /api/orchestrator/run`
- `GET /api/orchestrator/status/{orchestration_id}`
- `WS /api/orchestrator/stream/{orchestration_id}`
- `POST /api/agents/{agent_action}`
- `POST /api/rag/query`
- `POST /api/rag/ingest`
- `GET /metrics`

To run the Python service without Docker, create an environment in `server/fastapi_server`, install `requirements.txt`, and start it from that directory:

```bash
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The FastAPI service first attempts PostgreSQL and falls back to `sqlite_fallback.db` when PostgreSQL is unavailable. Redis and Qdrant also have fallback behavior for local development and tests, but the full Docker stack is recommended for orchestration and RAG workflows.

## Client Scripts

```bash
cd client
npm run dev       # Start Vite development server
npm run build     # Create client/dist production build
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
```

## Server Scripts

```bash
cd server
npm start         # Start the Express API
npm run dev       # Start the Express API in development
node test_prep.js # Exercise interview-prep persistence logic
node test_route_logic.js
```

FastAPI tests are located in `server/fastapi_server/tests` and can be run from the FastAPI directory with:

```bash
pytest
```

The optional benchmark expects FastAPI on port 8000:

```bash
python benchmark.py       # 50 concurrent users by default
python benchmark.py 10    # Choose a concurrency level
```

## Frontend Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public shell | Resume and portfolio builder |
| `/login` | Public | Login and signup |
| `/about` | Public | About page |
| `/contact` | Public | Contact page |
| `/portfolio/:slug` | Public | Published portfolio view |
| `/career-agent` | Authenticated | AI Career Agent workspace |
| `/knowledge-map` | Authenticated | Skills, roadmap, and mentor workspace |

## Express API Routes

All Express routes are prefixed with `/api`.

| Base route | Purpose |
| --- | --- |
| `/auth` | Signup, login, OTP, and Google authentication |
| `/resume` | Resume profile, configuration, experience, education, projects, and skills |
| `/ai` | Resume parsing, ATS scoring, keyword optimization, and bio optimization |
| `/upload` | Resume upload, parsing, and save workflows |
| `/generate` | ATS resume PDF generation |
| `/career-agents/orchestrator` | Run and inspect agent orchestrations |
| `/career-agents/resume` | Candidate profile and resume intelligence |
| `/career-agents/jobs` | Job discovery and formatting |
| `/career-agents/matches` | Candidate-to-job matching |
| `/career-agents/applications` | Applications, status, and outreach |
| `/career-agents/settings` | Agent preferences and auto-apply settings |
| `/career-agents/interviews` | Prep, mock interviews, studio sessions, transcripts, and analytics |
| `/career-agents/offers` | Offer analysis and status |
| `/career-agents/notifications` | Agent notifications |
| `/career-agents/email-sync` | Email connection and sync simulation |
| `/knowledge-map` | Skills, roadmaps, daily plans, mentor chat, and resources |

Protected requests use:

```http
Authorization: Bearer <jwt>
```

## Google OAuth

Google login uses `@react-oauth/google` and sends the resulting access token to `/api/auth/google`. Set `VITE_GOOGLE_CLIENT_ID` and `VITE_ENABLE_GOOGLE_LOGIN=true` to enable it.

For local development, add these exact origins to the OAuth client in Google Cloud Console:

```text
http://localhost:5173
http://127.0.0.1:5173
```

For the live deployment, add:

```text
https://next-folio-silk.vercel.app
```

Add origins without paths such as `/login`. Vercel preview URLs are different origins; the app redirects Google login from `*.vercel.app` previews to the stable production origin so OAuth can use one registered origin.

## Deployment

The root `vercel.json`:

- Installs root, client, and server dependencies.
- Builds the frontend with `cd client && npm run build`.
- Serves `client/dist`.
- Rewrites `/api/*` to `api/index.mjs`, which forwards to the Express server.
- Rewrites frontend routes to `index.html`.

Configure production values in Vercel Environment Variables instead of committing secrets:

- `JWT_SECRET`
- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_ENABLE_GOOGLE_LOGIN`
- `OPENAI_API_KEY`, when used by deployed server code
- `RESEND_API_KEY` and `OTP_FROM_EMAIL`, when using production OTP email

The FastAPI service requires its own deployment and environment configuration. Use `server/fastapi_server/Dockerfile` or `docker-compose.yml` as the container deployment baseline.

## Data and Security Notes

- Local Express data is stored in `server/database.sqlite`.
- FastAPI fallback data is stored in `server/fastapi_server/sqlite_fallback.db`.
- SQLite WAL/SHM sidecars, environment files, build output, dependency folders, Python caches, and logs are ignored by git.
- Never commit API keys, JWT secrets, OAuth client secrets, database credentials, or production environment files.
- Change the development defaults in `docker-compose.yml` before using the FastAPI stack outside local development.

## Additional Documentation

- [Architecture](ARCHITECTURE.md)
- [Deployment guide](DEPLOYMENT_GUIDE.md)
- [Documentation index](DOCUMENTATION_INDEX.md)
- [AI Career Agent plan](AI_CAREER_AGENT_PLAN.md)
- [Phase 1 completion summary](PHASE_1_COMPLETION_SUMMARY.md)
- [Phase 2 implementation](PHASE_2_IMPLEMENTATION.md)
- [Phase 2 completion](PHASE_2_COMPLETION.md)
- [Phase 2 quick start](PHASE_2_QUICK_START.md)
- [Project status dashboard](STATUS_DASHBOARD.md)
- [Client component guide](client/src/COMPONENT_GUIDE.md)
- [Client styling guide](client/src/STYLING_GUIDE.md)