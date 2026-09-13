import Agent from './Agent.js';
import { EmailAccount, EmailMessage, Application, Job, InterviewPrep, OfferRecord } from '../models/index.js';
import { runPythonAgent } from './PythonAgentBridge.js';
import { encrypt, decrypt } from '../utils/crypto.js';

export default class EmailTrackingAgent extends Agent {
  constructor(orchestrator) {
    super('EmailTracking', orchestrator);
    this.syncInterval = null;
  }

  async initialize() {
    await super.initialize();
    
    // Start simulated background checker polling every 30 seconds
    this.startBackgroundSync();
  }

  startBackgroundSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAllAccounts();
      } catch (err) {
        this.error('Background email sync error:', err);
      }
    }, 30000); // 30 seconds
    
    this.log('Simulated background monitoring scheduled.');
  }

  async cleanup() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    await super.cleanup();
  }

  async syncAllAccounts() {
    const activeAccounts = await EmailAccount.findAll({ where: { status: 'connected' } });
    for (const account of activeAccounts) {
      await this.syncAccount(account);
    }
  }

  async syncAccount(account) {
    this.log(`Syncing account: ${account.emailAddress}`);
    
    // Decrypt password or tokens if they are stored
    let decryptedPassword = null;
    if (account.password) {
      decryptedPassword = decrypt(account.password);
    }
    
    // Periodically (with 20% probability) simulate receiving a next-stage recruitment email 
    // for one of the user's active applications to simulate background monitoring.
    if (Math.random() < 0.2) {
      try {
        const apps = await Application.findAll({
          where: { userId: account.userId },
          include: [Job]
        });

        // Find active applications that are not finalized (i.e. not rejected/accepted)
        const activeApps = apps.filter(app => !['rejected', 'accepted', 'offer_accepted'].includes(app.status));
        
        if (activeApps.length > 0) {
          const selectedApp = activeApps[Math.floor(Math.random() * activeApps.length)];
          const job = selectedApp.Job;
          const company = job.company;
          const role = job.role;
          
          let sender = '';
          let subject = '';
          let body = '';
          
          if (selectedApp.status === 'applied') {
            const isOA = Math.random() < 0.5;
            if (isOA) {
              sender = `recruiting@${company.toLowerCase().replace(/\s+/g, '')}.com`;
              subject = `Action Required: HackerRank Coding Assessment for ${role} at ${company}`;
              body = `Hi Candidate, thank you for applying to the ${role} position at ${company}. As the next step, please complete this coding challenge: https://hackerrank.com/test/${company.toLowerCase().replace(/\s+/g, '')}-eval. The deadline is 7 days from now.`;
            } else {
              sender = `recruiter@${company.toLowerCase().replace(/\s+/g, '')}.com`;
              subject = `Interview Invitation: ${role} - ${company}`;
              body = `Hello, we were impressed with your application and would like to schedule a technical video call with our engineering team for the ${role} position at ${company}. Please book your slot here: https://meet.google.com/abc-xyz. Expected date: July 15, 2026 at 10:00 AM PST. Interviewers: Sundar Pichai.`;
            }
          } else if (selectedApp.status === 'assessment') {
            sender = `recruiter@${company.toLowerCase().replace(/\s+/g, '')}.com`;
            subject = `Next steps: Interview invitation for ${role} at ${company}`;
            body = `Hi, thank you for completing our online assessment. The team was pleased with your score and would love to move you forward to a technical interview for the ${role} position at ${company}. Please confirm your availability for July 15 at 10:00 AM PST. Interview Link: https://meet.google.com/abc-xyz.`;
          } else if (['under_review', 'viewed', 'interview_scheduled'].includes(selectedApp.status)) {
            const isOffer = Math.random() < 0.5;
            if (isOffer) {
              sender = `offers@${company.toLowerCase().replace(/\s+/g, '')}.com`;
              subject = `Official Offer of Employment: ${role} at ${company}`;
              body = `We are pleased to offer you the position of ${role} at ${company}! The base salary is $155,000 per year, starting on September 1, 2026. Please return signed documents by July 25, 2026. Required Documents: Signed W-4, I-9, Direct Deposit form.`;
            } else {
              sender = `noreply@${company.toLowerCase().replace(/\s+/g, '')}.jobs`;
              subject = `Update on your application for ${role} with ${company}`;
              body = `Thank you for taking the time to speak with us about the ${role} role at ${company}. Unfortunately, we have decided to move forward with other candidates whose experience matches our current needs more closely. We wish you the best in your search.`;
            }
          }

          if (sender && subject && body) {
            this.log(`[Background Sync] Simulating incoming email from ${sender} for matched app: ${role} at ${company}`);
            const messageId = `bg-sim-${Date.now()}`;
            await this.processEmail(account.userId, account.id, {
              messageId,
              sender,
              subject,
              body,
              receivedAt: new Date()
            });
          }
        }
      } catch (err) {
        this.error('Background sync simulation error:', err);
      }
    }
    
    // We update lastSyncedAt
    await account.update({ lastSyncedAt: new Date() });
  }

  /**
   * Process a single email message (called either by sync loop or simulator)
   */
  async processEmail(userId, emailAccountId, emailData) {
    const { messageId, sender, subject, body, receivedAt = new Date() } = emailData;

    // 1. Prevent duplicate processing
    const existing = await EmailMessage.findOne({ where: { userId, messageId } });
    if (existing) {
      this.log(`Message ${messageId} already processed. Skipping.`);
      return existing;
    }

    this.log(`Processing email from ${sender}: "${subject}"`);

    // 2. Classify email using AI (FastAPI agent) or regex fallback
    let aiResult = null;
    try {
      aiResult = await runPythonAgent('email.understand', { sender, subject, body });
      this.log(`AI categorization success: ${aiResult.classification}`);
    } catch (err) {
      this.log(`FastAPI email.understand offline or failed. Using fallback regex heuristics. Error: ${err.message}`);
      aiResult = this.runFallbackClassifier(sender, subject, body);
    }

    if (!aiResult.isJobRelated && aiResult.classification === 'Ignored/Spam') {
      this.log('Email classified as non-job related or spam. Ignoring.');
      return await EmailMessage.create({
        userId,
        emailAccountId,
        messageId,
        sender,
        subject,
        bodySnippet: body.substring(0, 200),
        receivedAt,
        classification: aiResult.classification,
        matchedJobId: null,
        summary: aiResult.summary || 'Spam or non-job related message.',
        actionRequired: null,
        status: 'ignored'
      });
    }

    // 3. Match email with an application in NextFolio
    const matchedApp = await this.findMatchingApplication(userId, sender, subject, body, aiResult.extractedDetails);

    let status = 'processed';
    let matchedJobId = null;
    let classification = aiResult.classification;
    let summary = aiResult.summary;
    let actionRequired = aiResult.actionRequired;

    if (matchedApp) {
      matchedJobId = matchedApp.jobId;
      const job = matchedApp.Job;

      this.log(`Email matched with application: ${job.role} at ${job.company}`);

      // 4. Update the application status in NextFolio
      const targetStatus = this.mapClassificationToStatus(classification);
      if (targetStatus && matchedApp.status !== targetStatus) {
        const oldStatus = matchedApp.status;
        
        // Trigger TrackingAgent for db update + event emission
        const trackingAgent = this.orchestrator.getAgent('Tracking');
        await trackingAgent.run({
          applicationId: matchedApp.id,
          oldStatus,
          newStatus: targetStatus,
          userId,
          jobId: matchedJobId
        });

        // Add to auditLog
        const updatedAudit = [...(matchedApp.auditLog || []), {
          timestamp: new Date().toISOString(),
          message: `Email synced: ${classification}. Summary: ${summary}`
        }];
        
        // Update timeline status changes
        const updatedTimeline = [...(matchedApp.timeline || []), {
          status: targetStatus,
          timestamp: new Date().toISOString(),
          notes: summary
        }];

        await matchedApp.update({
          auditLog: updatedAudit,
          timeline: updatedTimeline,
          status: targetStatus
        });

        // 5. Special workflow integrations (Interview Prep or Offer Letter creation)
        if (targetStatus === 'interview_scheduled') {
          await this.autoCreateInterviewPrep(userId, job, aiResult.extractedDetails);
        } else if (targetStatus === 'offer_received') {
          await this.autoCreateOfferRecord(userId, job, aiResult.extractedDetails);
        }

        // 6. Notify user immediately
        await this.triggerNotification(userId, job, classification, targetStatus);
      }
    } else {
      this.log('Could not find a high-confidence matching application. Saving as pending manual confirmation.');
      status = 'pending_user_confirmation';
    }

    // 7. Save logged email message
    return await EmailMessage.create({
      userId,
      emailAccountId,
      messageId,
      sender,
      subject,
      bodySnippet: body.substring(0, 200),
      receivedAt,
      classification,
      matchedJobId,
      summary,
      actionRequired,
      status
    });
  }

  runFallbackClassifier(sender, subject, body) {
    const text = (subject + ' ' + body).toLowerCase();
    let classification = 'Unknown';
    let isJobRelated = true;
    let summary = '';
    let actionRequired = '';
    let extractedDetails = { company: null, role: null };

    // Heuristics
    if (text.includes('interview') || text.includes('speak') || text.includes('zoom') || text.includes('call') || text.includes('calendar') || text.includes('schedule')) {
      classification = 'Interview Invitation';
      summary = `Simulated Interview Invitation from recruiter.`;
      actionRequired = 'Schedule your interview slot.';
    } else if (text.includes('offer') || text.includes('salary') || text.includes('joining date') || text.includes('compensation')) {
      classification = 'Offer Letter';
      summary = `Simulated Job Offer letter.`;
      actionRequired = 'Review and accept/decline the offer.';
      extractedDetails.salary = 120000; // fallback standard salary
    } else if (text.includes('assessment') || text.includes('test link') || text.includes('hackerrank') || text.includes('codility') || text.includes('online test')) {
      classification = 'Online Assessment';
      summary = `Simulated Online Coding Assessment.`;
      actionRequired = 'Complete the online coding test before the deadline.';
    } else if (text.includes('unfortunately') || text.includes('not moving forward') || text.includes('selected another') || text.includes('other candidates') || text.includes('unable to move')) {
      classification = 'Rejection';
      summary = `Simulated Rejection update.`;
      actionRequired = 'Resume search or get suggestions for resume improvements.';
    } else if (text.includes('application received') || text.includes('applying') || text.includes('applied')) {
      classification = 'Application Received';
      summary = `Simulated Application Receipt confirmation.`;
    } else {
      classification = 'Unknown';
      isJobRelated = false;
      summary = 'Non-recruitment message.';
    }

    // Try to guess company from subject or sender
    const words = subject.split(' ');
    for (const w of words) {
      if (w.length > 3 && !['with', 'your', 'from', 'jobs', 'work'].includes(w.toLowerCase())) {
        extractedDetails.company = w.replace(/[,.-]/g, '');
        break;
      }
    }

    return {
      isJobRelated,
      classification,
      summary,
      actionRequired,
      extractedDetails
    };
  }

  async findMatchingApplication(userId, sender, subject, body, extractedDetails) {
    const apps = await Application.findAll({
      where: { userId },
      include: [Job]
    });

    const emailText = (sender + ' ' + subject + ' ' + body).toLowerCase();

    // 1. Try company matching from LLM extracted details first
    if (extractedDetails && extractedDetails.company) {
      const match = apps.find(app => 
        app.Job.company.toLowerCase().includes(extractedDetails.company.toLowerCase()) ||
        extractedDetails.company.toLowerCase().includes(app.Job.company.toLowerCase())
      );
      if (match) return match;
    }

    // 2. Try company matching by checking if any application company is present in email text
    for (const app of apps) {
      const company = app.Job.company.toLowerCase();
      // Avoid matching super short common words
      if (company.length > 2 && emailText.includes(company)) {
        return app;
      }
    }

    return null;
  }

  mapClassificationToStatus(classification) {
    switch (classification) {
      case 'Application Received':
        return 'applied';
      case 'Online Assessment':
        return 'assessment';
      case 'Interview Invitation':
        return 'interview_scheduled';
      case 'Offer Letter':
        return 'offer_received';
      case 'Rejection':
        return 'rejected';
      default:
        return null;
    }
  }

  async autoCreateInterviewPrep(userId, job, extractedDetails) {
    // Check if interview prep already exists for this company
    const existing = await InterviewPrep.findOne({ where: { userId, company: job.company } });
    const prepData = {
      userId,
      company: job.company,
      role: job.role,
      interviewDate: extractedDetails?.date || null,
      interviewTime: extractedDetails?.time || null,
      timezone: extractedDetails?.timezone || null,
      meetingLink: extractedDetails?.meetingLink || null,
      interviewerNames: extractedDetails?.interviewerNames || [],
      interviewType: extractedDetails?.interviewType || 'technical',
      status: 'pending'
    };

    if (!existing) {
      await InterviewPrep.create({
        ...prepData,
        questions: {
          technical: [
            { question: `Explain your experience building web applications like ${job.role}.`, answerOutline: 'Discuss relevant tech stack, architectural designs, and optimization decisions.' },
            { question: `How would you optimize performance for a front-end client?`, answerOutline: 'Discuss bundling, code splitting, lazy loading, compression, and caching strategies.' }
          ],
          hr: [
            { question: `Why are you interested in joining ${job.company}?`, answerOutline: 'Highlight company values, product challenges, and personal career alignment.' },
            { question: `Tell me about a time you handled a difficult engineering problem.`, answerOutline: 'Use the STAR format: situation, task, action, and business results.' }
          ],
          systemDesign: [
            { question: `Design a real-time message notifications pipeline.`, answerOutline: 'Discuss WebSockets, publisher-subscriber system, queues, caching, and database storage.' }
          ]
        }
      });
      this.log(`Auto-created Interview Prep guide for ${job.company}`);
    } else {
      await existing.update(prepData);
      this.log(`Updated Interview Prep guide scheduling details for ${job.company}`);
    }
  }

  async autoCreateOfferRecord(userId, job, extractedDetails) {
    // Check if offer record already exists
    const existing = await OfferRecord.findOne({ where: { userId, company: job.company } });
    const salary = (extractedDetails && extractedDetails.salary) ? parseInt(extractedDetails.salary) : 110000;
    const offerData = {
      userId,
      company: job.company,
      role: job.role,
      salary,
      location: job.location || extractedDetails?.location || 'Remote',
      joiningDate: extractedDetails?.joiningDate || extractedDetails?.date || null,
      responseDeadline: extractedDetails?.responseDeadline || extractedDetails?.deadline || null,
      requiredDocuments: extractedDetails?.requiredDocuments || [],
      status: 'pending',
      pros: ['Great compensation package', 'Reputable company brand'],
      cons: ['Standard benefits structure'],
      negotiationSuggestions: `Prepare market salary comparison details for a ${job.role} in ${job.location || 'Remote'}.`
    };

    if (!existing) {
      await OfferRecord.create(offerData);
      this.log(`Auto-created Job Offer Record for ${job.company}`);
    } else {
      await existing.update(offerData);
      this.log(`Updated Job Offer Record details for ${job.company}`);
    }
  }

  async triggerNotification(userId, job, classification, status) {
    try {
      const notificationAgent = this.orchestrator.getAgent('Notification');
      let icon = '📄';
      if (status === 'interview_scheduled') icon = '🎉';
      if (status === 'offer_received') icon = '🏆';
      if (status === 'rejected') icon = '❌';

      const message = `${icon} ${job.company} has updated your status to ${classification.toUpperCase()}.`;
      
      await notificationAgent.run({
        userId,
        type: 'application_status',
        message
      });
    } catch (err) {
      this.error('Failed to trigger status notification:', err);
    }
  }
}
