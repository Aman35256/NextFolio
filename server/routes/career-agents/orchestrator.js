import express from 'express';
import crypto from 'crypto';
import { AgentExecution, CandidateProfile, AgentSettings } from '../../models/index.js';
import orchestrator from '../../agents/AgentOrchestrator.js';

const router = express.Router();

/**
 * POST /api/career-agents/orchestrator/run
 * Run the Multi-Agent execution pipeline based on user query and context inputs.
 */
router.post('/run', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { query, resumeData, jobDescription } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Missing user query parameter' });
    }

    // Fetch user settings and candidate profile if they exist
    const settings = await AgentSettings.findOne({ where: { userId } });
    const profile = await CandidateProfile.findOne({ where: { userId } });

    const orchestrationId = crypto.randomUUID();

    // Trigger the Master AI Orchestrator pipeline in the background asynchronously
    orchestrator.runPipeline({
      userId,
      query,
      resumeData: resumeData || (profile ? profile.toJSON() : null),
      jobDescription,
      settings: settings ? settings.toJSON() : {},
      profile: profile ? profile.toJSON() : null,
      orchestrationId
    }).catch(error => {
      console.error('[Background Pipeline Error]:', error);
    });

    res.json({
      success: true,
      orchestrationId,
      status: 'triggered'
    });
  } catch (error) {
    console.error('[Orchestrator Route] Error running pipeline:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/orchestrator/status/:orchestrationId
 * Fetch agent execution logs for a specific orchestration run.
 */
router.get('/status/:orchestrationId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orchestrationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const logs = await AgentExecution.findAll({
      where: { userId, orchestrationId },
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      orchestrationId,
      logs
    });
  } catch (error) {
    console.error('[Orchestrator Route] Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/orchestrator/history
 * Fetch a list of past orchestration pipeline executions for the current user.
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // SQLite query to group executions by orchestrationId and select the latest timestamp
    const history = await AgentExecution.findAll({
      where: { userId },
      attributes: [
        'orchestrationId',
        'createdAt',
        'status',
        'agentName'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group logs by orchestrationId in Javascript
    const grouped = {};
    for (const log of history) {
      const oid = log.orchestrationId;
      if (!grouped[oid]) {
        grouped[oid] = {
          orchestrationId: oid,
          timestamp: log.createdAt,
          agents: [],
          status: 'completed'
        };
      }
      grouped[oid].agents.push(log.agentName);
      if (log.status === 'failed') {
        grouped[oid].status = 'failed';
      } else if (log.status === 'running' && grouped[oid].status !== 'failed') {
        grouped[oid].status = 'running';
      }
    }

    res.json({
      success: true,
      history: Object.values(grouped)
    });
  } catch (error) {
    console.error('[Orchestrator Route] Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
