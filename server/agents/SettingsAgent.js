import Agent from './Agent.js';
import { AgentSettings } from '../models/index.js';

const DEFAULT_SETTINGS = {
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
};

export default class SettingsAgent extends Agent {
  constructor(orchestrator) {
    super('Settings', orchestrator);
  }

  async getSettings({ userId }) {
    const [settings] = await AgentSettings.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        ...DEFAULT_SETTINGS,
      },
    });

    return {
      success: true,
      settings,
    };
  }

  async updateSettings({ userId, updates }) {
    const [settings] = await AgentSettings.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        ...DEFAULT_SETTINGS,
      },
    });

    await settings.update(updates);

    return {
      success: true,
      settings,
      message: 'Agent settings updated successfully',
    };
  }
}
