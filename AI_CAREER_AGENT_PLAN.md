# AI Career Agent - Comprehensive Implementation Plan

## 📊 Project Overview
Transform NextFolio into an AI-powered Career Operating System with autonomous agents that handle the entire job-hunting lifecycle.

---

## 🎯 Phase Breakdown

### Phase 1: Infrastructure & UI Foundation (Days 1-3)
**Goal:** Set up frontend structure, routing, and base components

#### 1.1 Frontend Structure
- [ ] Create `/client/src/features/CareerAgent/` directory
- [ ] Set up sub-modules:
  - `ResumeIntelligence/`
  - `JobDiscovery/`
  - `JobMatches/`
  - `AutoApply/`
  - `Applications/`
  - `InterviewPrep/`
  - `Notifications/`
  - `OfferAnalysis/`
  - `AgentSettings/`
- [ ] Create routing structure in `/client/src/pages/CareerAgentPage.jsx`
- [ ] Add sidebar navigation item with subsections

#### 1.2 Shared Components
- [ ] `JobCard.jsx` - Display job listings
- [ ] `MatchingScoreBar.jsx` - Show 0-100 match percentage
- [ ] `SkillBadge.jsx` - Display skill matches
- [ ] `TimelineStatus.jsx` - Application status timeline
- [ ] `MetricsCard.jsx` - KPI cards for dashboard
- [ ] `AIAgentIndicator.jsx` - Show agent activity status
- [ ] `ProfileCard.jsx` - Candidate profile display

#### 1.3 State Management
- [ ] Extend Zustand store with CareerAgent module:
  - `resumeData` - Parsed resume information
  - `candidateProfile` - Generated profile from resume
  - `jobs` - Discovered job opportunities
  - `applications` - User applications
  - `matches` - Job matches with scores
  - `agentSettings` - Auto-apply rules and preferences
  - `notifications` - Career-related alerts

#### 1.4 Layout & Navigation
- [ ] Update `Sidebar.jsx` with AI Career Agent section
- [ ] Create `CareerAgentLayout.jsx` with tab navigation
- [ ] Match existing NextFolio design system

---

### Phase 2: Resume Intelligence Agent (Days 3-5)
**Goal:** Parse, analyze, and generate candidate profile

#### 2.1 Backend API Endpoint
- [ ] Create `/server/routes/career-agents/resume.js`
- [ ] Endpoint: `POST /api/career-agents/resume/analyze`
- [ ] Parse resume using existing PDF parser + LLM
- [ ] Extract structured data:
  - Name, email, phone, location
  - Experience (companies, roles, duration)
  - Education (degree, university, field)
  - Skills (technical, soft skills)
  - Certifications
  - Projects
  - Languages
  - Preferred industries/locations

#### 2.2 Data Normalization
- [ ] Standardize skill names (e.g., "JS" → "JavaScript")
- [ ] Categorize skills (frontend, backend, DevOps, etc.)
- [ ] Extract years of experience per skill
- [ ] Identify seniority level

#### 2.3 AI Scoring System
- [ ] Calculate ATS score (0-100)
- [ ] Identify missing certifications for roles
- [ ] Generate skill recommendations
- [ ] Create skills graph visualization data

#### 2.4 Frontend Components
- [ ] `/client/src/features/CareerAgent/ResumeIntelligence/ProfileCard.jsx`
  - Display name, headline, location
  - ATS score badge
  - Years of experience
  - Top skills
- [ ] `SkillsGraph.jsx` - Visualize skill distribution
- [ ] `RecommendationsPanel.jsx` - Show missing skills
- [ ] `EducationTimeline.jsx` - Display education history

---

### Phase 3: Backend Agent Framework (Days 5-8)
**Goal:** Set up multi-agent orchestration and event system

#### 3.1 Agent Architecture
- [ ] Create `/server/agents/` directory with base classes:
  - `Agent.js` - Base agent class
  - `EventBus.js` - Event-driven architecture
  - `AgentOrchestrator.js` - Manage agent lifecycle
  - `MessageQueue.js` - BullMQ integration

#### 3.2 Database Models
- [ ] Create Sequelize models:
  - `CandidateProfile` - User profile from resume
  - `Job` - Job opportunities
  - `JobMatch` - Match records with scores
  - `Application` - Application history
  - `AgentLog` - Track agent activities
  - `Notification` - Career notifications
  - `OfferRecord` - Offers received

#### 3.3 Event System
- [ ] Implement event types:
  - `resume.uploaded`
  - `resume.analyzed`
  - `job.discovered`
  - `job.matched`
  - `application.submitted`
  - `status.updated`
  - `interview.scheduled`
  - `offer.received`

#### 3.4 Message Queue Setup
- [ ] Integrate Redis + BullMQ
- [ ] Create job queues:
  - `resume-processing`
  - `job-discovery`
  - `job-matching`
  - `auto-apply`
  - `notification-dispatch`

---

### Phase 4: Job Discovery Agent (Days 8-12)
**Goal:** Autonomous job crawler from multiple sources

#### 4.1 Job Sources Integration
- [ ] LinkedIn Jobs API (if available, else scrape)
- [ ] Indeed API
- [ ] Wellfound API
- [ ] Glassdoor scraper
- [ ] Naukri API
- [ ] Foundit scraper
- [ ] Company career pages
- [ ] Startup job boards (HackerNews, Y Combinator)
- [ ] International portals (Stack Overflow, GitHub Jobs)

#### 4.2 Job Crawler Service
- [ ] Create `/server/services/jobCrawler.js`
- [ ] Normalize job data across sources
- [ ] De-duplicate jobs
- [ ] Extract metadata:
  - Company
  - Role title
  - Location
  - Salary range
  - Experience required
  - Remote status
  - Visa sponsorship
  - Job description
  - Apply URL
  - Posted date

#### 4.3 Scheduling
- [ ] Set up cron jobs (every 3/6/12 hours based on config)
- [ ] Filter by user preferences (location, industry, skills)
- [ ] Store to database
- [ ] Trigger matching agent

#### 4.4 Frontend Display
- [ ] `JobDiscovery/JobFeed.jsx` - Browse all discovered jobs
- [ ] Job filters (location, salary, remote, experience)
- [ ] Search functionality
- [ ] Pagination

---

### Phase 5: Job Matching Agent (Days 12-16)
**Goal:** Intelligent job-to-candidate matching with explainability

#### 5.1 Matching Algorithm
- [ ] Create `/server/services/jobMatcher.js`
- [ ] Scoring factors (weights configurable):
  - Skills match (40%)
  - Experience relevance (25%)
  - Education relevance (10%)
  - Project relevance (10%)
  - Salary fit (10%)
  - Location preference (5%)
  - Industry preference (0%)

#### 5.2 Skills Matching Engine
- [ ] Use vector embeddings (Pinecone or Weaviate)
- [ ] Calculate semantic similarity between:
  - Candidate skills
  - Job requirements
- [ ] Handle skill variations (e.g., "JS" vs "JavaScript")

#### 5.3 Experience Matching
- [ ] Years of experience in required domain
- [ ] Relevant company history
- [ ] Industry crossover

#### 5.4 Match Explainability
- [ ] Generate "Why this role matches" insights
- [ ] List matching skills with ✓
- [ ] Highlight missing requirements
- [ ] Suggest skill gaps to fill

#### 5.5 Frontend Components
- [ ] `JobMatches/MatchCard.jsx`
  - Match score (0-100)
  - Visual progress bar
  - Top 3 matching criteria
  - Missing skills
  - Action buttons (View, Apply, Save)

---

### Phase 6: Auto Apply Agent (Days 16-20)
**Goal:** Autonomous application submission with audit logs

#### 6.1 Application Rules Engine
- [ ] Create `/server/services/autoApplyEngine.js`
- [ ] Rule types:
  - Match score threshold
  - Salary range
  - Location
  - Remote requirement
  - Company specific
  - Visa sponsorship

#### 6.2 Application Workflow
- [ ] Detect application form type (JSON-based if possible)
- [ ] Auto-fill standard fields:
  - Name, email, phone, location
  - Education, experience
  - Cover letter (AI-generated)
- [ ] Handle screening questions with AI
- [ ] Upload resume automatically
- [ ] Submit application

#### 6.3 Audit & Logging
- [ ] Log every application:
  - Timestamp
  - Job ID
  - Company
  - Submission status
  - Form data submitted
  - AI decisions made

#### 6.4 Frontend Settings
- [ ] `AgentSettings/AutoApplyRules.jsx`
  - Set match score threshold
  - Configure salary ranges
  - Location preferences
  - Enable/disable by company
  - Require approval mode

---

### Phase 7: AI Cover Letter Agent (Days 20-22)
**Goal:** Generate personalized, compelling cover letters

#### 7.1 Cover Letter Generation
- [ ] Create `/server/services/coverLetterGenerator.js`
- [ ] Input context:
  - Resume data
  - Job description
  - Company details
  - User preferences
- [ ] Generate personalized cover letter
- [ ] Output components:
  - Professional greeting
  - Opening paragraph (why you're interested)
  - Body (relevant experience)
  - Closing (call to action)

#### 7.2 Application Response Handler
- [ ] AI-generated responses for screening questions
- [ ] Context-aware answers
- [ ] Professional tone

#### 7.3 Frontend Display
- [ ] Show generated cover letter before submission
- [ ] Allow editing before applying
- [ ] Save favorite templates for similar roles

---

### Phase 8: Application Tracking Agent (Days 22-24)
**Goal:** Track entire application lifecycle with timeline

#### 8.1 Status Tracking
- [ ] Statuses: Applied, Viewed, Under Review, Assessment, Interview Scheduled, Interview Completed, Offer Received, Rejected
- [ ] Update mechanism (manual + webhook integration)
- [ ] Timeline events with timestamps

#### 8.2 Application Dashboard
- [ ] List all applications with status
- [ ] Filter by status, company, date
- [ ] Sort options

#### 8.3 Frontend Components
- [ ] `Applications/ApplicationList.jsx`
- [ ] `Applications/ApplicationDetail.jsx`
- [ ] `Applications/TimelineView.jsx` - Visual timeline
- [ ] Status badges with icons

---

### Phase 9: Notification Agent (Days 24-26)
**Goal:** Real-time alerts across multiple channels

#### 9.1 Notification Types
- [ ] Application viewed
- [ ] Assessment assigned
- [ ] Interview scheduled
- [ ] Offer received
- [ ] Rejection

#### 9.2 Delivery Channels
- [ ] In-app notifications (bell icon)
- [ ] Email notifications
- [ ] Browser push notifications

#### 9.3 Email Integration
- [ ] Create `/server/services/emailService.js`
- [ ] Professional email templates
- [ ] SMTP configuration

#### 9.4 Frontend Components
- [ ] Notification bell with badge count
- [ ] Notification center panel
- [ ] Notification preferences

---

### Phase 10: Interview Preparation Agent (Days 26-30)
**Goal:** AI-powered interview coaching and prep

#### 10.1 Interview Detection & Analysis
- [ ] Detect interview in applications
- [ ] Analyze job description + company
- [ ] Research company (news, culture, recent events)

#### 10.2 Question Generation
- [ ] Technical questions (based on skills)
- [ ] HR questions (behavioral)
- [ ] System design questions (if applicable)
- [ ] Role-specific questions

#### 10.3 Mock Interview Simulation
- [ ] Interactive practice module
- [ ] Record mock interview (optional)
- [ ] AI feedback on answers
- [ ] Performance score

#### 10.4 Frontend Components
- [ ] `InterviewPrep/InterviewDashboard.jsx`
- [ ] `InterviewPrep/QuestionList.jsx`
- [ ] `InterviewPrep/MockInterview.jsx`
- [ ] Feedback panel with scoring

---

### Phase 11: Offer Evaluation Agent (Days 30-32)
**Goal:** Comprehensive offer analysis and negotiation guidance

#### 11.1 Offer Analysis
- [ ] Base salary vs market rate
- [ ] Cost of living adjustment
- [ ] Benefits breakdown
- [ ] Equity calculation
- [ ] Bonus structure
- [ ] PTO policy
- [ ] Sign-on bonus

#### 11.2 Market Comparison
- [ ] Compare with similar roles (Glassdoor, Levels.fyi)
- [ ] Location-based comparison
- [ ] Company reputation impact

#### 11.3 Negotiation Suggestions
- [ ] Identify negotiable items
- [ ] Market-based counter-offer suggestions
- [ ] Pros/cons analysis

#### 11.4 Frontend Components
- [ ] `OfferAnalysis/OfferComparison.jsx`
- [ ] `OfferAnalysis/OfferScore.jsx`
- [ ] Market comparison charts

---

### Phase 12: Analytics Dashboard (Days 32-34)
**Goal:** Comprehensive career metrics and insights

#### 12.1 KPI Cards
- [ ] Applications submitted (total + this month)
- [ ] Interviews received (count + rate)
- [ ] Offers received
- [ ] Acceptance rate
- [ ] Application success rate

#### 12.2 Visualizations
- [ ] Applications by status (pie chart)
- [ ] Top matching skills (bar chart)
- [ ] Most active regions (map or list)
- [ ] Application timeline (line chart)
- [ ] Company distribution

#### 12.3 Frontend Components
- [ ] Dashboard homepage with widgets
- [ ] Chart components using Chart.js or Recharts

---

### Phase 13: Integration & Polish (Days 34-36)
**Goal:** End-to-end integration and user experience refinement

#### 13.1 Integration Testing
- [ ] Test agent orchestration
- [ ] Test event flow
- [ ] Test data consistency

#### 13.2 Performance Optimization
- [ ] Database indexing
- [ ] Query optimization
- [ ] Frontend lazy loading

#### 13.3 Error Handling
- [ ] Graceful failure modes
- [ ] User-friendly error messages
- [ ] Retry mechanisms

#### 13.4 User Documentation
- [ ] How to set up resume
- [ ] Configuring auto-apply rules
- [ ] Understanding match scores
- [ ] FAQ

---

## 🛠️ Tech Stack Implementation

### Frontend Enhancements
```
client/
├── src/
│   ├── features/CareerAgent/
│   │   ├── ResumeIntelligence/
│   │   ├── JobDiscovery/
│   │   ├── JobMatches/
│   │   ├── AutoApply/
│   │   ├── Applications/
│   │   ├── InterviewPrep/
│   │   ├── Notifications/
│   │   ├── OfferAnalysis/
│   │   ├── AgentSettings/
│   │   ├── Dashboard/
│   │   └── index.js
│   └── utils/
│       ├── careerAgentAPI.js
│       └── agentHelpers.js
```

### Backend Enhancements
```
server/
├── agents/
│   ├── Agent.js
│   ├── ResumeAgent.js
│   ├── JobDiscoveryAgent.js
│   ├── MatchingAgent.js
│   ├── AutoApplyAgent.js
│   ├── CoverLetterAgent.js
│   ├── TrackingAgent.js
│   ├── NotificationAgent.js
│   ├── InterviewAgent.js
│   ├── OfferAgent.js
│   ├── EventBus.js
│   └── AgentOrchestrator.js
├── routes/
│   ├── careerAgents/
│   │   ├── resume.js
│   │   ├── jobs.js
│   │   ├── matches.js
│   │   ├── applications.js
│   │   ├── notifications.js
│   │   ├── interviews.js
│   │   └── settings.js
│   └── ...
├── services/
│   ├── jobCrawler.js
│   ├── jobMatcher.js
│   ├── autoApplyEngine.js
│   ├── coverLetterGenerator.js
│   ├── emailService.js
│   ├── notificationService.js
│   └── aiService.js
├── models/
│   ├── CandidateProfile.js
│   ├── Job.js
│   ├── JobMatch.js
│   ├── Application.js
│   ├── Notification.js
│   └── OfferRecord.js
└── ...
```

### New Dependencies

**Frontend:**
```json
{
  "recharts": "^2.10.0",
  "framer-motion": "^10.16.0",
  "react-hot-toast": "^2.4.0",
  "axios": "^1.6.0"
}
```

**Backend:**
```json
{
  "bullmq": "^5.0.0",
  "redis": "^4.6.0",
  "pinecone-client": "^2.1.0",
  "nodemailer": "^6.9.0",
  "puppeteer": "^21.0.0",
  "cheerio": "^1.0.0",
  "openai": "^4.0.0",
  "google-generative-ai": "^0.3.0",
  "node-cron": "^3.0.0"
}
```

---

## 📅 Timeline
- **Total Duration:** ~36 days
- **Phases:** 13 major phases
- **Parallel Work:** Phases can be parallelized with proper API contracts

---

## 🚀 Success Metrics
1. ✅ 5+ job sources integrated
2. ✅ 90%+ job matching accuracy
3. ✅ Auto-apply working for 80%+ of jobs
4. ✅ <100ms match score calculation
5. ✅ 100% resume parsing accuracy
6. ✅ All features UI-consistent with NextFolio

---

## 🔐 Security Considerations
- [ ] Encrypt sensitive data (salary, personal info)
- [ ] Rate limit job crawler
- [ ] Secure API keys in environment variables
- [ ] HTTPS for all external requests
- [ ] User permission checks on all endpoints
- [ ] Audit logs for all agent actions

---

## 📝 Notes
- Maintain existing NextFolio design system throughout
- Ensure backward compatibility with existing features
- All agents should be stateless for horizontal scaling
- Event-driven architecture enables future webhook integrations
