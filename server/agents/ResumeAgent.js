import Agent from './Agent.js';
import { CandidateProfile } from '../models/index.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class ResumeAgent extends Agent {
  constructor(orchestrator) {
    super('Resume', orchestrator);
  }

  async initialize() {
    await super.initialize();
    this.eventBus.subscribe('resume.analyzed', async (data) => {
      await this.run(data);
    });
  }

  async run(data) {
    const { userId } = data;
    this.log(`Handling resume.analyzed event for user ${userId}`);
    
    // Automatically trigger job discovery after resume is analyzed
    this.orchestrator.triggerJobDiscovery(userId);
  }

  async analyzeResume({ userId, resumeData }) {
    if (!userId || !resumeData) {
      const error = new Error('Missing required fields: userId, resumeData');
      error.statusCode = 400;
      throw error;
    }

    // Call local FastAPI Resume Analysis Service
    const analysisResult = await runPythonAgent('resume.analyze', { resumeData });
    const { 
      profileData, 
      profilePayload, 
      atsScore, 
      missingSkills, 
      skillsGraph, 
      resumeSummary, 
      skillRecommendations, 
      profileStrength, 
      metrics, 
      recommendations 
    } = analysisResult;

    // Create or update candidate profile in SQLite database
    const [profile, created] = await CandidateProfile.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        ...profileData,
      },
    });

    if (!created) {
      await profile.update(profileData);
    }

    this.eventBus.publish('resume.analyzed', { userId, profileId: profile.id });

    return {
      success: true,
      profile: {
        id: profile.id,
        ...profilePayload
      },
      atsScore,
      missingSkills,
      skillsGraph,
      resumeSummary,
      skillRecommendations,
      profileStrength,
      metrics,
      recommendations,
      message: 'Resume analyzed successfully',
    };
  }

  async getProfile({ userId }) {
    const profile = await CandidateProfile.findOne({ where: { userId } });

    if (!profile) {
      const error = new Error('Profile not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      profile: profile.dataValues,
    };
  }

  async updateProfile({ userId, updates }) {
    const profile = await CandidateProfile.findOne({ where: { userId } });

    if (!profile) {
      const error = new Error('Profile not found');
      error.statusCode = 404;
      throw error;
    }

    const allowedFields = ['fullName', 'headline', 'location', 'phone', 'email', 'summary'];
    const profileUpdates = allowedFields.reduce((acc, field) => {
      if (updates[field]) acc[field] = updates[field];
      return acc;
    }, {});

    await profile.update({
      ...profileUpdates,
      lastUpdated: new Date(),
    });

    return {
      success: true,
      profile: profile.dataValues,
      message: 'Profile updated successfully',
    };
  }
}
