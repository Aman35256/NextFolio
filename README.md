# NextFolio

NextFolio is a full-stack resume and portfolio builder. It lets authenticated users upload a resume, extract structured profile data, edit that data in a focused builder, preview an ATS-style resume and web portfolio, score the resume, generate a PDF, and publish a local share link.

Live deployment: https://next-folio-silk.vercel.app/

## Features

- Resume upload and parsing for PDF/text content through Node and Python helper scripts.
- Login, signup, email OTP, and Google OAuth authentication.
- Form-based resume editing for personal info, bio, skills, education, experience, projects, achievements, and certifications.
- Real-time preview modes for an ATS resume and a web portfolio.
- Portfolio themes including modern, minimal/default, and CLI-style terminal views.
- Design controls for theme, color palette, and layout style.
- ATS score analysis with actionable improvement suggestions.
- Keyword comparison against a target job description.
- AI-assisted bio optimization with an OpenAI-backed path when `OPENAI_API_KEY` is configured, plus local fallback behavior.
- PDF generation for an ATS-friendly resume through Puppeteer.
- Local portfolio publishing to `/portfolio/:slug` using browser storage.
- Vercel deployment setup with API rewrites to the Express server handler.

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
| Auth UI | `@react-oauth/google` |

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
| Serverless entry | `api/index.mjs` exporting `server/server.js` |

### Python Services

The server starts these scripts as child processes when needed:

| File | Purpose |
| --- | --- |
| `server/services/ai_parser.py` | Extracts resume sections and normalizes parsed data |
| `server/services/ats_scorer.py` | Calculates ATS score and recommendations |
| `server/services/keyword_optimizer.py` | Finds missing job-description keywords |
| `server/services/bio_optimizer.py` | Optimizes professional summaries |

## Project Structure

```text
NextFolio/
|-- api/
|   `-- index.mjs                 # Vercel serverless entry for the Express app
|-- client/
|   |-- public/                   # Static assets, CLI portfolio assets
|   |-- src/
|   |   |-- components/           # Shared UI components and modals
|   |   |-- features/             # Builder, previews, AI assistant, themes
|   |   |-- layouts/              # Main authenticated workspace
|   |   |-- lib/                  # API, Google auth, build info helpers
|   |   |-- pages/                # About, Contact, Login, Published portfolio
|   |   |-- store/                # Zustand resume and UI state
|   |   `-- main.jsx
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- models/                   # Sequelize models and SQLite setup
|   |-- routes/                   # Auth, resume, AI, upload, PDF routes
|   |-- services/                 # Python parsing/scoring/optimization scripts
|   |-- server.js                 # Express app and serverless handler
|   |-- database.sqlite           # Local SQLite database
|   `-- package.json
|-- vercel.json                   # Root Vercel build, env, headers, rewrites
|-- package.json                  # Root dependency metadata
`-- README.md
```

## Prerequisites

- Node.js 18 or newer.
- npm.
- Python 3 available as `python` on your PATH.
- Google OAuth credentials if Google login is enabled.
- Optional: OpenAI API key for stronger bio generation.
- Optional: Resend API key and verified sender for production OTP email.

## Environment Variables

Create local environment files as needed. The repo ignores `.env` files.

### Server: `server/.env`

```env
PORT=5000
JWT_SECRET=replace_with_a_strong_secret
OPENAI_API_KEY=optional_openai_key
RESEND_API_KEY=optional_resend_key
OTP_FROM_EMAIL=onboarding@resend.dev
```

Notes:

- `JWT_SECRET` falls back to a development default if omitted, but production should always set it.
- OTP codes are logged in non-production when Resend is not configured.
- `OPENAI_API_KEY` is optional. Without it, `bio_optimizer.py` uses local fallback text generation.

### Client: `client/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_ENABLE_GOOGLE_LOGIN=true
VITE_APP_VERSION=local
```

Notes:

- The frontend appends `/api` automatically, so both `http://localhost:5000` and `http://localhost:5000/api` are accepted.
- In production, Google login is only enabled when `VITE_ENABLE_GOOGLE_LOGIN=true` and a usable client ID is present.

## Local Setup

Install backend and frontend dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Run the app in two terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Open http://localhost:5173.

The client defaults to `http://localhost:5000/api` during development when `VITE_API_URL` is not set.

## Available Scripts

### Client

```bash
cd client
npm run dev       # Start Vite
npm run build     # Create production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Server

```bash
cd server
npm start         # Start Express
npm run dev       # Start Express, same command as start
```

## API Overview

All routes are mounted under `/api`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/signup` | No | Create account with name, email, and password |
| POST | `/auth/login` | No | Login with email and password |
| POST | `/auth/otp/request` | No | Request login/signup OTP |
| POST | `/auth/otp/verify` | No | Verify OTP and return JWT auth payload |
| POST | `/auth/google` | No | Login/signup from a Google access token |
| GET | `/resume` | Yes | Fetch the current user's resume data |
| PUT | `/resume/personal` | Yes | Save personal information |
| PUT | `/resume/config` | Yes | Save theme, color palette, and layout style |
| POST | `/resume/experience` | Yes | Add experience |
| PUT | `/resume/experience/:id` | Yes | Update experience |
| DELETE | `/resume/experience/:id` | Yes | Delete experience |
| POST | `/resume/education` | Yes | Add education |
| DELETE | `/resume/education/:id` | Yes | Delete education |
| POST | `/resume/project` | Yes | Add project |
| DELETE | `/resume/project/:id` | Yes | Delete project |
| POST | `/resume/skill` | Yes | Add skill |
| DELETE | `/resume/skill/:id` | Yes | Delete skill |
| POST | `/ai/parse` | Yes | Upload and parse resume file |
| POST | `/ai/ats-score` | Yes | Score resume data |
| POST | `/ai/optimize` | Yes | Find missing keywords from a job description |
| POST | `/ai/optimize-bio` | Yes | Optimize professional summary |
| POST | `/upload/parse-resume` | No | Alternate parser endpoint for PDF/text upload |
| POST | `/upload/save-resume-data` | Yes | Persist parsed resume sections |
| GET | `/upload/resume-status` | Yes | Check which resume sections exist |
| POST | `/generate/ats-resume` | Yes | Generate ATS resume PDF |

Authenticated requests use:

```http
Authorization: Bearer <token>
```

## Deployment

The root `vercel.json` is configured for Vercel:

- Installs root, client, and server dependencies.
- Builds the frontend from `client`.
- Serves `client/dist`.
- Rewrites `/api/*` to `api/index.mjs`.
- Rewrites all other routes to the frontend `index.html`.

Before deploying, set production environment variables in Vercel instead of committing secrets. At minimum, configure `JWT_SECRET`, `VITE_API_URL`, and Google OAuth values if Google login is enabled.

## Notes for Development

- `server/database.sqlite` is the local SQLite database used by Sequelize.
- Uploaded resume parsing currently supports PDF and text extraction paths; the main client upload accepts `.pdf` and `.docx`, but the parser treats non-PDF content as UTF-8 text.
- The main editor currently auto-saves personal information to the API; other sections live in client state unless saved through their dedicated routes or upload flow.
- Portfolio publishing stores data in localStorage under the generated slug, so links are browser-local rather than globally hosted records.

## Documentation

Additional project notes live in:

- `ARCHITECTURE.md`
- `DEPLOYMENT_GUIDE.md`
- `DOCUMENTATION_INDEX.md`
- `COMPLETION_SUMMARY.md`
- `client/src/COMPONENT_GUIDE.md`
- `client/src/STYLING_GUIDE.md`
