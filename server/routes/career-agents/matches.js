import express from 'express';
import { JobMatch, Job } from '../../models/index.js';
import orchestrator from '../../agents/AgentOrchestrator.js';

const router = express.Router();

/**
 * GET /api/career-agents/matches
 * Get all job matches for the current user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const matches = await JobMatch.findAll({
      where: { userId },
      include: [
        {
          model: Job,
          required: true,
        },
      ],
      order: [['matchScore', 'DESC']],
    });

    // Format matches for frontend
    const formatted = matches.map((m) => ({
      id: m.id,
      jobId: m.jobId,
      company: m.Job.company,
      title: m.Job.role,
      location: m.Job.location,
      salary: m.Job.salary,
      remoteStatus: m.Job.remoteStatus,
      visaSponsorship: m.Job.visaSponsorship,
      applyUrl: m.Job.applyUrl,
      jobDescription: m.Job.jobDescription,
      originalSource: m.Job.originalSource,
      matchScore: m.matchScore,
      status: m.status,
      explanation: m.explanation,
    }));

    res.json({ success: true, matches: formatted });
  } catch (error) {
    console.error('Fetch matches error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/matches
 * Evaluate new jobs and generate match scores
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all jobs
    const jobs = await Job.findAll();
    
    // Evaluate match for each job
    const promises = jobs.map((job) =>
      orchestrator.triggerJobMatching(userId, job.id)
    );
    await Promise.all(promises);

    // Fetch the updated matches
    const matches = await JobMatch.findAll({
      where: { userId },
      include: [
        {
          model: Job,
          required: true,
        },
      ],
      order: [['matchScore', 'DESC']],
    });

    const formatted = matches.map((m) => ({
      id: m.id,
      jobId: m.jobId,
      company: m.Job.company,
      title: m.Job.role,
      location: m.Job.location,
      salary: m.Job.salary,
      remoteStatus: m.Job.remoteStatus,
      visaSponsorship: m.Job.visaSponsorship,
      applyUrl: m.Job.applyUrl,
      jobDescription: m.Job.jobDescription,
      originalSource: m.Job.originalSource,
      matchScore: m.matchScore,
      status: m.status,
      explanation: m.explanation,
    }));

    res.json({
      success: true,
      matches: formatted,
      message: 'Job matches evaluated successfully',
    });
  } catch (error) {
    console.error('Trigger matches error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
