import express from 'express';
import { Application, Job, JobMatch } from '../../models/index.js';
import orchestrator from '../../agents/AgentOrchestrator.js';

const router = express.Router();

/**
 * GET /api/career-agents/applications
 * Get all applications for the logged-in user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const applications = await Application.findAll({
      where: { userId },
      include: [
        {
          model: Job,
          required: true,
        },
      ],
      order: [['submissionTimestamp', 'DESC']],
    });

    const formatted = applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      company: app.Job.company,
      role: app.Job.role,
      location: app.Job.location,
      salary: app.Job.salary,
      remoteStatus: app.Job.remoteStatus,
      applyUrl: app.Job.applyUrl,
      status: app.status,
      autoApplied: app.autoApplied,
      submissionTimestamp: app.submissionTimestamp,
      notes: app.notes,
      auditLog: app.auditLog,
    }));

    res.json({ success: true, applications: formatted });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ error: error.message });
  }
});



/**
 * PUT /api/career-agents/applications/:id/status
 * Manually update the status lifecycle of an application
 */
router.put('/:id/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    const applicationId = req.params.id;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const app = await Application.findOne({
      where: { id: applicationId, userId },
      include: [Job],
    });

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const oldStatus = app.status;
    const trackingAgent = orchestrator.getAgent('tracking');
    await trackingAgent.run({
      applicationId,
      oldStatus,
      newStatus: status,
      userId,
      jobId: app.jobId,
    });

    res.json({
      success: true,
      message: `Status updated from ${oldStatus} to ${status}`,
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/applications/:id/outreach
 * Generate a personalized networking outreach message for this role
 */
router.post('/:id/outreach', async (req, res) => {
  try {
    const userId = req.user?.id;
    const applicationId = req.params.id;
    const { type } = req.body; // 'recruiter', 'manager', 'alumni'

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const app = await Application.findOne({
      where: { id: applicationId, userId },
      include: [Job],
    });

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const profile = await CandidateProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(400).json({ error: 'Candidate profile required' });
    }

    const networkingAgent = orchestrator.getAgent('networking');
    const outreach = await networkingAgent.run({
      profile,
      job: app.Job,
      type: type || 'recruiter',
    });

    res.json({
      success: true,
      outreach,
    });
  } catch (error) {
    console.error('Generate outreach error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
