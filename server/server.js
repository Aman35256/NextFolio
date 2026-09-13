import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { syncDb } from './models/index.js';

// Import Routes
import authRoutes, { authMiddleware } from './routes/auth.js';
import resumeRoutes from './routes/resume.js';
import aiRoutes from './routes/ai.js';
import generateRoutes from './routes/generate.js';
import uploadRoutes from './routes/upload.js';
import careerAgentResumeRoutes from './routes/career-agents/resume.js';
import careerAgentJobsRoutes from './routes/career-agents/jobs.js';
import careerAgentMatchesRoutes from './routes/career-agents/matches.js';
import careerAgentApplicationsRoutes from './routes/career-agents/applications.js';
import careerAgentSettingsRoutes from './routes/career-agents/settings.js';
import careerAgentInterviewsRoutes from './routes/career-agents/interviews.js';
import careerAgentOffersRoutes from './routes/career-agents/offers.js';
import careerAgentNotificationsRoutes from './routes/career-agents/notifications.js';
import careerAgentEmailSyncRoutes from './routes/career-agents/email-sync.js';
import careerAgentOrchestratorRoutes from './routes/career-agents/orchestrator.js';
import knowledgeMapRoutes from './routes/knowledge-map.js';

import orchestrator from './agents/AgentOrchestrator.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/generate', generateRoutes);

// Career Agent Module Routes (Protected)
app.use('/api/career-agents/orchestrator', authMiddleware, careerAgentOrchestratorRoutes);
app.use('/api/career-agents/resume', authMiddleware, careerAgentResumeRoutes);
app.use('/api/career-agents/jobs', authMiddleware, careerAgentJobsRoutes);
app.use('/api/career-agents/matches', authMiddleware, careerAgentMatchesRoutes);
app.use('/api/career-agents/applications', authMiddleware, careerAgentApplicationsRoutes);
app.use('/api/career-agents/settings', authMiddleware, careerAgentSettingsRoutes);
app.use('/api/career-agents/interviews', authMiddleware, careerAgentInterviewsRoutes);
app.use('/api/career-agents/offers', authMiddleware, careerAgentOffersRoutes);
app.use('/api/career-agents/notifications', authMiddleware, careerAgentNotificationsRoutes);
app.use('/api/career-agents/email-sync', authMiddleware, careerAgentEmailSyncRoutes);
app.use('/api/knowledge-map', authMiddleware, knowledgeMapRoutes);

const dbReady = syncDb().then(async () => {
  // Initialize agents
  await orchestrator.initialize();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

if (!process.env.VERCEL) {
  dbReady.then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing server or start this one with a different PORT value.`);
        process.exit(1);
      }

      throw err;
    });
  });
}

export default async function handler(req, res) {
  await dbReady;
  return app(req, res);
}
