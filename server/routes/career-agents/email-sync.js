import express from 'express';
import { EmailAccount, EmailMessage, Job } from '../../models/index.js';
import orchestrator from '../../agents/AgentOrchestrator.js';
import { encrypt } from '../../utils/crypto.js';

const router = express.Router();

/**
 * GET /api/career-agents/email-sync
 * Get all connected email accounts and current status
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connections = await EmailAccount.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, connections });
  } catch (error) {
    console.error('Fetch email connections error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/email-sync/connect
 * Connect a simulated email account
 */
router.post('/connect', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { provider, emailAddress, imapHost, imapPort, password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!provider || !emailAddress) {
      return res.status(400).json({ error: 'Provider and emailAddress are required' });
    }

    // Check if account already connected
    const existing = await EmailAccount.findOne({ where: { userId, emailAddress } });
    if (existing) {
      return res.status(400).json({ error: 'This email account is already connected.' });
    }

    let encryptedPassword = null;
    let encryptedAccessToken = null;
    let encryptedRefreshToken = null;

    if (password) {
      encryptedPassword = encrypt(password);
    }

    // For Gmail/Outlook simulated OAuth, generate simulated credentials and encrypt them
    if (['gmail', 'outlook', 'microsoft_365', 'yahoo'].includes(provider)) {
      encryptedAccessToken = encrypt(`sim_access_token_${Date.now()}`);
      encryptedRefreshToken = encrypt(`sim_refresh_token_${Date.now()}`);
    }

    const connection = await EmailAccount.create({
      userId,
      provider,
      emailAddress,
      imapHost: imapHost || null,
      imapPort: imapPort ? parseInt(imapPort, 10) : null,
      password: encryptedPassword,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      status: 'connected',
      lastSyncedAt: new Date(),
    });

    res.json({ success: true, connection, message: 'Email account connected successfully.' });
  } catch (error) {
    console.error('Connect email error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/email-sync/disconnect/:id
 * Disconnect an email account
 */
router.post('/disconnect/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const account = await EmailAccount.findOne({ where: { id, userId } });
    if (!account) {
      return res.status(404).json({ error: 'Email connection not found.' });
    }

    await account.destroy();

    res.json({ success: true, message: 'Email account disconnected successfully.' });
  } catch (error) {
    console.error('Disconnect email error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/email-sync/toggle/:id
 * Pause/Resume email account syncing
 */
router.post('/toggle/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const account = await EmailAccount.findOne({ where: { id, userId } });
    if (!account) {
      return res.status(404).json({ error: 'Email connection not found.' });
    }

    const newStatus = account.status === 'connected' ? 'paused' : 'connected';
    await account.update({ status: newStatus });

    res.json({ success: true, account, message: `Email sync status updated to ${newStatus}.` });
  } catch (error) {
    console.error('Toggle email sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/email-sync/logs
 * Get list of processed email logs
 */
router.get('/logs', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const logs = await EmailMessage.findAll({
      where: { userId },
      order: [['receivedAt', 'DESC']],
    });

    // Format logs with matched job details if possible
    const formattedLogs = await Promise.all(logs.map(async (log) => {
      let matchedJob = null;
      if (log.matchedJobId) {
        matchedJob = await Job.findByPk(log.matchedJobId);
      }
      return {
        id: log.id,
        sender: log.sender,
        subject: log.subject,
        bodySnippet: log.bodySnippet,
        receivedAt: log.receivedAt,
        classification: log.classification,
        summary: log.summary,
        actionRequired: log.actionRequired,
        status: log.status,
        matchedJob: matchedJob ? { company: matchedJob.company, role: matchedJob.role } : null
      };
    }));

    res.json({ success: true, logs: formattedLogs });
  } catch (error) {
    console.error('Fetch email logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/email-sync/simulate
 * Manually feed a mock/test email to trigger status changes
 */
router.post('/simulate', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sender, subject, body } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!sender || !subject || !body) {
      return res.status(400).json({ error: 'Sender, subject, and body are required' });
    }

    // Find or create a simulated email account for mock sync
    let [account] = await EmailAccount.findOrCreate({
      where: { userId, emailAddress: 'simulated@nextfolio.ai' },
      defaults: {
        userId,
        provider: 'imap',
        emailAddress: 'simulated@nextfolio.ai',
        status: 'connected',
        lastSyncedAt: new Date()
      }
    });

    // Get the EmailTrackingAgent
    const emailTrackingAgent = orchestrator.getAgent('emailTracking');
    
    // Process the simulated email
    const messageId = `sim-${Date.now()}`;
    const log = await emailTrackingAgent.processEmail(userId, account.id, {
      messageId,
      sender,
      subject,
      body,
      receivedAt: new Date()
    });

    res.json({ success: true, log, message: 'Simulated email processed successfully.' });
  } catch (error) {
    console.error('Simulate email sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/email-sync/resolve/:id
 * Manually match an unmatched email to an application
 */
router.post('/resolve/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { jobId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required to match application.' });
    }

    const emailMessage = await EmailMessage.findOne({ where: { id, userId } });
    if (!emailMessage) {
      return res.status(404).json({ error: 'Email message log not found.' });
    }

    const { Application, Job } = await import('../../models/index.js');
    const application = await Application.findOne({
      where: { userId, jobId },
      include: [Job]
    });
    if (!application) {
      return res.status(404).json({ error: 'Active application not found for matching.' });
    }

    const emailTrackingAgent = orchestrator.getAgent('emailTracking');
    const classification = emailMessage.classification;
    const targetStatus = emailTrackingAgent.mapClassificationToStatus(classification);
    
    if (targetStatus && application.status !== targetStatus) {
      const oldStatus = application.status;

      // Run status tracker update
      const trackingAgent = orchestrator.getAgent('Tracking');
      await trackingAgent.run({
        applicationId: application.id,
        oldStatus,
        newStatus: targetStatus,
        userId,
        jobId
      });

      // Update application logs
      const updatedAudit = [...(application.auditLog || []), {
        timestamp: new Date().toISOString(),
        message: `Email resolved manually: ${classification}. Summary: ${emailMessage.summary}`
      }];
      const updatedTimeline = [...(application.timeline || []), {
        status: targetStatus,
        timestamp: new Date().toISOString(),
        notes: emailMessage.summary
      }];

      await application.update({
        auditLog: updatedAudit,
        timeline: updatedTimeline,
        status: targetStatus
      });

      // Extract metadata helper
      const mockExtractedDetails = {
        company: application.Job.company,
        role: application.Job.role,
        salary: null,
        date: new Date().toISOString().split('T')[0]
      };

      // Trigger downstream preps/offers
      if (targetStatus === 'interview_scheduled') {
        await emailTrackingAgent.autoCreateInterviewPrep(userId, application.Job, mockExtractedDetails);
      } else if (targetStatus === 'offer_received') {
        await emailTrackingAgent.autoCreateOfferRecord(userId, application.Job, mockExtractedDetails);
      }

      // Notify
      await emailTrackingAgent.triggerNotification(userId, application.Job, classification, targetStatus);
    }

    // Mark email as matched and processed
    await emailMessage.update({
      matchedJobId: jobId,
      status: 'processed'
    });

    res.json({
      success: true,
      message: 'Email matched and application updated successfully.',
      log: emailMessage
    });
  } catch (error) {
    console.error('Resolve email match error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
