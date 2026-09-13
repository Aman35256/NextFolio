import crypto from 'crypto';
import ResumeAgent from './ResumeAgent.js';
import JobDiscoveryAgent from './JobDiscoveryAgent.js';
import MatchingAgent from './MatchingAgent.js';
import CoverLetterAgent from './CoverLetterAgent.js';
import TrackingAgent from './TrackingAgent.js';
import EmailTrackingAgent from './EmailTrackingAgent.js';
import NotificationAgent from './NotificationAgent.js';
import InterviewAgent from './InterviewAgent.js';
import NetworkingAgent from './NetworkingAgent.js';
import OfferAgent from './OfferAgent.js';
import SkillExtractionAgent from './SkillExtractionAgent.js';
import RoadmapAgent from './RoadmapAgent.js';
import DailyPlanAgent from './DailyPlanAgent.js';
import MentorshipAgent from './MentorshipAgent.js';
import SettingsAgent from './SettingsAgent.js';
import eventBus from './EventBus.js';
import { runPythonAgent } from './PythonAgentBridge.js';
import { AgentExecution, CandidateProfile } from '../models/index.js';

// Import New Multi-Agent Ecosystem
import ProfileCompletionAgent from './ProfileCompletionAgent.js';
import ATSAnalysisAgent from './ATSAnalysisAgent.js';
import ResumeImprovementAgent from './ResumeImprovementAgent.js';
import JobDescriptionAgent from './JobDescriptionAgent.js';
import KeywordOptimizationAgent from './KeywordOptimizationAgent.js';
import PortfolioGenerationAgent from './PortfolioGenerationAgent.js';
import CareerRecommendationAgent from './CareerRecommendationAgent.js';
import ContentQualityAgent from './ContentQualityAgent.js';
import PDFGenerationAgent from './PDFGenerationAgent.js';

class AgentOrchestrator {
  constructor() {
    this.agents = {};
    this.eventBus = eventBus;
  }

  async initialize() {
    console.log('[AgentOrchestrator] Initializing Multi-Agent Orchestrator...');

    // Instantiate all agents
    this.agents.resume = new ResumeAgent(this);
    this.agents.jobDiscovery = new JobDiscoveryAgent(this);
    this.agents.matching = new MatchingAgent(this);
    this.agents.coverLetter = new CoverLetterAgent(this);
    this.agents.tracking = new TrackingAgent(this);
    this.agents.emailTracking = new EmailTrackingAgent(this);
    this.agents.notification = new NotificationAgent(this);
    this.agents.interview = new InterviewAgent(this);
    this.agents.networking = new NetworkingAgent(this);
    this.agents.offer = new OfferAgent(this);
    this.agents.settings = new SettingsAgent(this);
    
    // Knowledge Map Agents
    this.agents.skillExtraction = new SkillExtractionAgent(this);
    this.agents.roadmap = new RoadmapAgent(this);
    this.agents.dailyPlan = new DailyPlanAgent(this);
    this.agents.mentorship = new MentorshipAgent(this);

    // Register New Agent Ecosystem
    this.agents.profileCompletion = new ProfileCompletionAgent(this);
    this.agents.atsAnalysis = new ATSAnalysisAgent(this);
    this.agents.resumeImprovement = new ResumeImprovementAgent(this);
    this.agents.jobDescription = new JobDescriptionAgent(this);
    this.agents.keywordOptimization = new KeywordOptimizationAgent(this);
    this.agents.portfolioGeneration = new PortfolioGenerationAgent(this);
    this.agents.careerRecommendation = new CareerRecommendationAgent(this);
    this.agents.contentQuality = new ContentQualityAgent(this);
    this.agents.pdfGeneration = new PDFGenerationAgent(this);

    // Initialize all agents (registers their event subscribers)
    for (const [name, agent] of Object.entries(this.agents)) {
      await agent.initialize();
    }

    // Connect global notification dispatcher
    this.eventBus.subscribe('notification.dispatch', async (data) => {
      await this.agents.notification.run(data);
    });

    // Purge fake/mock jobs to comply with the strict "no fake jobs" requirement
    try {
      const { Job, JobMatch, Application } = await import('../models/index.js');
      const { Op } = await import('sequelize');
      const fakeJobs = await Job.findAll({
        where: {
          originalSource: {
            [Op.notIn]: ['Remotive', 'Arbeitnow']
          }
        }
      });
      const fakeJobIds = fakeJobs.map(j => j.id);
      if (fakeJobIds.length > 0) {
        console.log(`[AgentOrchestrator] Purging ${fakeJobIds.length} fake/mock jobs and related matches/applications...`);
        await JobMatch.destroy({ where: { jobId: { [Op.in]: fakeJobIds } } });
        await Application.destroy({ where: { jobId: { [Op.in]: fakeJobIds } } });
        await Job.destroy({ where: { id: { [Op.in]: fakeJobIds } } });
      }
    } catch (e) {
      console.error('[AgentOrchestrator] Error purging fake jobs:', e);
    }

    console.log('[AgentOrchestrator] Multi-Agent Orchestrator is operational.');
  }

  getAgent(name) {
    const agent = this.agents[name];
    if (!agent) {
      throw new Error(`Agent "${name}" not found in orchestrator`);
    }
    return agent;
  }

  async runAgentAction(agentName, actionName, payload = {}) {
    const agent = this.getAgent(agentName);
    const action = agent[actionName];

    if (typeof action !== 'function') {
      throw new Error(`Action "${actionName}" not found on agent "${agentName}"`);
    }

    return action.call(agent, payload);
  }

  // Trigger Job Discovery
  async triggerJobDiscovery(userId, filters = {}) {
    // Run job discovery in background asynchronously
    setImmediate(async () => {
      try {
        await this.agents.jobDiscovery.run({ userId, filters });
      } catch (err) {
        console.error(`[AgentOrchestrator] Error executing background JobDiscovery for user ${userId}:`, err);
      }
    });
  }

  // Trigger Job Match Evaluation
  async triggerJobMatching(userId, jobId) {
    return await this.agents.matching.run({ userId, jobId });
  }



  // Generate Outreach message
  async generateOutreach(userId, jobId, type) {
    const profile = await this.agents.resume.run({ userId }); // simple profile fetch wrapper
    // Actually we can do direct queries
    return await this.agents.networking.run({ userId, jobId, type });
  }

  // Execute Master Multi-Agent Pipeline
  async runPipeline({ userId, query, resumeData, jobDescription, settings, profile, orchestrationId }) {
    const activeOrchestrationId = orchestrationId || crypto.randomUUID();
    console.log(`[AgentOrchestrator] Starting pipeline execution ${activeOrchestrationId} for user ${userId}`);

    try {
      const result = await runPythonAgent('orchestrator.run', {
        orchestrationId: activeOrchestrationId,
        userId,
        query,
        resumeData,
        jobDescription,
        settings,
        profile
      });

      if (!result || !result.success) {
        throw new Error(result ? result.error : 'Python agent returned an empty response');
      }

      const pipelineSteps = result.pipeline || [];

      // If ResumeParsingAgent or another agent updated the profile, update it in SQLite CandidateProfile
      const context = result.context || {};
      if (context.profile && (context.profile.fullName || context.profile.personal?.fullName)) {
        const p = context.profile;
        const normalizedSkills = Array.isArray(p.skills) ? p.skills : [];
        const topSkills = normalizedSkills.slice(0, 8);
        const skillCategories = {}; // Simple categorization placeholder
        
        const profileData = {
          fullName: p.fullName || p.personal?.fullName || 'Profile',
          email: p.email || p.personal?.email || '',
          phone: p.phone || p.personal?.phone || '',
          location: p.location || p.personal?.location || '',
          headline: p.headline || (topSkills.length > 0 ? `${topSkills[0]} Professional` : 'Job Seeker'),
          summary: p.summary || p.personal?.summary || '',
          atsScore: context.atsAnalysis?.atsScore || 70,
          profileStrength: context.profileCompletion?.completenessScore || 80,
          allSkills: normalizedSkills,
          topSkills,
          skillCategories,
          experience: p.experience || [],
          education: p.education || [],
          certifications: p.certifications || [],
          missingSkills: (context.keywordOptimization?.missingKeywords || []).map(s => ({ skill: s, category: 'General', priority: 'High' })),
          yearsOfExperience: p.yearsOfExperience || 0.0,
          skillCount: normalizedSkills.length,
          projectCount: (p.projects || []).length,
          lastUpdated: new Date()
        };

        const [profileRecord, created] = await CandidateProfile.findOrCreate({
          where: { userId },
          defaults: { userId, ...profileData }
        });

        if (!created) {
          await profileRecord.update(profileData);
        }
      }

      return {
        success: true,
        orchestrationId: activeOrchestrationId,
        reasoning: result.reasoning,
        pipeline: pipelineSteps,
        result: context
      };
    } catch (err) {
      console.error(`[AgentOrchestrator] Pipeline execution failed:`, err);
      // Register a failed execution log in the database
      await AgentExecution.create({
        userId,
        orchestrationId: activeOrchestrationId,
        agentName: 'Master AI Orchestrator',
        status: 'failed',
        progress: 100,
        reasoning: 'Pipeline aborted due to critical error.',
        planning: 'Halt all agents.',
        validation: 'Failed',
        confidence: 0,
        executionTime: 0,
        error: err.message
      });

      return {
        success: false,
        orchestrationId: activeOrchestrationId,
        error: err.message
      };
    }
  }
}

export const orchestrator = new AgentOrchestrator();
export default orchestrator;
