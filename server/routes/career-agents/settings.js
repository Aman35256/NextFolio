import express from 'express';
import { AgentSettings } from '../../models/index.js';

const router = express.Router();

/**
 * GET /api/career-agents/settings
 * Fetch candidate agent rules and preferences
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [settings] = await AgentSettings.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        enabled: false,
        matchScoreThreshold: 75,
        salaryMin: 0,
        remoteOnly: false,
        requiresApproval: true,
        allowedCountries: ['Any'],
        blockedCompanies: [],
        preferredRoles: [],
        preferredLocations: [],
        preferredIndustries: [],
      },
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/career-agents/settings
 * Update agent rules and preferences
 */
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await AgentSettings.findOne({ where: { userId } });
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    await settings.update(req.body);

    res.json({
      success: true,
      settings,
      message: 'Agent settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
