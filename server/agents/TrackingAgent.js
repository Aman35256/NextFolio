import Agent from './Agent.js';
import { Application } from '../models/index.js';

export default class TrackingAgent extends Agent {
  constructor(orchestrator) {
    super('Tracking', orchestrator);
  }

  async initialize() {
    await super.initialize();
  }

  async run(data) {
    const { applicationId, oldStatus, newStatus, userId, jobId } = data;
    this.log(`Tracking state change: ${oldStatus} -> ${newStatus} for application ${applicationId}`);

    try {
      const app = await Application.findByPk(applicationId);
      if (!app) {
        throw new Error(`Application ${applicationId} not found`);
      }

      await app.update({
        status: newStatus,
        notes: app.notes ? `${app.notes}\nStatus changed to ${newStatus}` : `Status changed to ${newStatus}`,
      });

      // Emit event for state change
      this.eventBus.publish('application.statusChanged', {
        userId,
        jobId,
        applicationId,
        oldStatus,
        newStatus,
      });

    } catch (err) {
      this.error(`Error tracking application status change for ${applicationId}`, err);
    }
  }
}
