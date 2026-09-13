import Agent from './Agent.js';
import { Notification, User, Job } from '../models/index.js';
import { Resend } from 'resend';

export default class NotificationAgent extends Agent {
  constructor(orchestrator) {
    super('Notification', orchestrator);
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      this.resend = new Resend(resendKey);
    }
  }

  async initialize() {
    await super.initialize();

    // Listen to job matching events
    this.eventBus.subscribe('job.matched', async (data) => {
      if (data.matchScore >= 85) {
        await this.notifyNewMatch(data);
      }
    });

    // Listen to application submissions
    this.eventBus.subscribe('application.submitted', async (data) => {
      await this.notifySubmission(data);
    });

    // Listen to application status changes
    this.eventBus.subscribe('application.statusChanged', async (data) => {
      await this.notifyStatusChange(data);
    });
  }

  async run(data) {
    // Standard notify helper
    const { userId, type, message } = data;
    await this.createNotification(userId, type, message);
  }

  async createNotification(userId, type, message) {
    this.log(`Creating notification for user ${userId}: [${type}] ${message}`);
    try {
      const notification = await Notification.create({
        userId,
        type,
        message,
        read: false,
        timestamp: new Date(),
      });

      // Attempt to send email
      const user = await User.findByPk(userId);
      if (user && user.email) {
        await this.sendEmail(user.email, `Career Agent: ${type.replace('_', ' ').toUpperCase()}`, message);
      }

      return notification;
    } catch (err) {
      this.error(`Failed to create notification for user ${userId}`, err);
    }
  }

  async notifyNewMatch(data) {
    const { userId, jobId, matchScore } = data;
    try {
      const job = await Job.findByPk(jobId);
      const company = job ? job.company : 'a company';
      const role = job ? job.role : 'matching role';
      
      const message = `Excellent match found! We identified a ${Math.round(matchScore)}% match for the position of ${role} at ${company}.`;
      await this.createNotification(userId, 'new_match', message);
    } catch (err) {
      this.error('Error handling notifyNewMatch', err);
    }
  }

  async notifySubmission(data) {
    const { userId, jobId, autoApplied } = data;
    try {
      const job = await Job.findByPk(jobId);
      const company = job ? job.company : 'a company';
      const role = job ? job.role : 'matching role';
      
      const applyType = autoApplied ? 'automatically applied' : 'submitted an application';
      const message = `Your Career Agent has ${applyType} for the role of ${role} at ${company}.`;
      await this.createNotification(userId, 'application_status', message);
    } catch (err) {
      this.error('Error handling notifySubmission', err);
    }
  }

  async notifyStatusChange(data) {
    const { userId, jobId, newStatus } = data;
    try {
      const job = await Job.findByPk(jobId);
      const company = job ? job.company : 'a company';
      const role = job ? job.role : 'matching role';
      
      const formattedStatus = newStatus.replace('_', ' ').toUpperCase();
      const message = `The application status for ${role} at ${company} has been updated to: ${formattedStatus}.`;
      await this.createNotification(userId, 'application_status', message);

      // Trigger Interview prep if interview scheduled
      if (newStatus === 'interview_scheduled') {
        this.eventBus.publish('interview.scheduled', { userId, jobId, company, role });
      } else if (newStatus === 'offer_received') {
        this.eventBus.publish('offer.received', { userId, jobId, company, role });
      }
    } catch (err) {
      this.error('Error handling notifyStatusChange', err);
    }
  }

  async sendEmail(toEmail, subject, textContent) {
    if (!this.resend) {
      this.log(`Resend not configured. Simulated email to ${toEmail}: [${subject}] - "${textContent}"`);
      return;
    }

    try {
      const fromEmail = process.env.OTP_FROM_EMAIL || 'onboarding@resend.dev';
      await this.resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: subject,
        text: textContent,
      });
      this.log(`Email successfully dispatched to ${toEmail}`);
    } catch (err) {
      this.error(`Failed to send email to ${toEmail} via Resend`, err);
    }
  }
}
