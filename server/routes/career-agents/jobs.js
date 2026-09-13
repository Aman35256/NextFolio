import express from 'express';
import { Job, AgentSettings } from '../../models/index.js';
import orchestrator from '../../agents/AgentOrchestrator.js';

const router = express.Router();

/**
 * GET /api/career-agents/jobs
 * List all discovered job opportunities
 */
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findAll({
      order: [['dateDiscovered', 'DESC']],
    });
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/jobs/discover
 * Trigger manual background crawler search
 */
router.post('/discover', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filters } = req.body;

    // Fetch user settings to supplement filters
    const settings = await AgentSettings.findOne({ where: { userId } });
    const discoveryFilters = {
      preferredRoles: settings?.preferredRoles || filters?.preferredRoles || [],
      preferredLocations: settings?.preferredLocations || filters?.preferredLocations || [],
      ...filters,
    };

    // Run job discovery (it runs asynchronously in background)
    await orchestrator.triggerJobDiscovery(userId, discoveryFilters);

    res.json({
      success: true,
      message: 'Job discovery agent started in the background.',
    });
  } catch (error) {
    console.error('Job discovery trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/jobs/:id/format
 * Formats a specific job description using AI parsing and templates
 */
router.post('/:id/format', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // If already formatted, return cached version
    if (job.formattedData) {
      return res.json({ success: true, formattedData: job.formattedData });
    }

    // Run JobDescriptionAgent to parse/enhance
    const parsedResult = await orchestrator.runAgentAction('jobDescription', 'run', {
      jobDescription: job.jobDescription,
      role: job.role,
      company: job.company,
      location: job.location,
      salary: job.salary,
      jobType: job.jobType
    });

    // Save to database
    await job.update({ formattedData: parsedResult });

    res.json({ success: true, formattedData: parsedResult });
  } catch (error) {
    console.error('Format job error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
