/**
 * InterviewSessionService
 * Manages interview sessions, state, and lifecycle
 */

import { InterviewSession, InterviewTranscript, InterviewPrep, InterviewAnalytics } from '../models/index.js';

export default class InterviewSessionService {
  /**
   * Create a new interview session
   */
  async createSession(userId, prepId, options = {}) {
    try {
      const prep = await InterviewPrep.findOne({
        where: { id: prepId, userId }
      });

      if (!prep) {
        throw new Error('Interview prep not found');
      }

      const session = await InterviewSession.create({
        userId,
        interviewPrepId: prepId,
        company: prep.company,
        role: prep.role,
        interviewerPersona: options.interviewerPersona || 'Senior Engineer',
        difficulty: options.difficulty || 'medium',
        interviewType: options.interviewType || 'mixed',
        questions: options.questions || this.generateQuestions(prep),
        status: 'not_started',
      });

      return session;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw error;
    }
  }

  /**
   * Generate adaptive questions based on prep materials
   */
  generateQuestions(prep) {
    const allQuestions = [];
    
    // Mix questions based on interview type
    if (prep.questions?.technical) {
      allQuestions.push(...prep.questions.technical.map(q => ({
        ...q,
        type: 'technical'
      })));
    }
    if (prep.questions?.hr) {
      allQuestions.push(...prep.questions.hr.map(q => ({
        ...q,
        type: 'behavioral'
      })));
    }
    if (prep.questions?.systemDesign) {
      allQuestions.push(...prep.questions.systemDesign.map(q => ({
        ...q,
        type: 'system_design'
      })));
    }

    // Shuffle and limit to 5-8 questions for a session
    return allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(8, allQuestions.length));
  }

  /**
   * Start an interview session
   */
  async startSession(sessionId, userId) {
    try {
      const session = await InterviewSession.findOne({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      await session.update({
        status: 'in_progress',
        startTime: new Date(),
      });

      return session;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Pause/resume session
   */
  async pauseSession(sessionId, userId) {
    try {
      const session = await InterviewSession.findOne({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      const newStatus = session.status === 'in_progress' ? 'paused' : 'in_progress';
      await session.update({ status: newStatus });

      return session;
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  }

  /**
   * End/complete an interview session
   */
  async endSession(sessionId, userId) {
    try {
      const session = await InterviewSession.findOne({
        where: { id: sessionId, userId },
        include: [
          {
            model: InterviewTranscript,
            attributes: ['communicationScore', 'technicalScore', 'behaviorScore', 'confidenceScore']
          }
        ]
      });

      if (!session) {
        throw new Error('Session not found');
      }

      const endTime = new Date();
      const duration = Math.floor((endTime - session.startTime) / 1000); // seconds

      // Calculate scores from transcripts
      const transcripts = await InterviewTranscript.findAll({
        where: { sessionId }
      });

      const scores = this.calculateSessionScores(transcripts);

      await session.update({
        status: 'completed',
        endTime,
        duration,
        overallScore: scores.overall,
        communicationScore: scores.communication,
        technicalScore: scores.technical,
        behaviorScore: scores.behavior,
        confidenceScore: scores.confidence,
        interviewReadiness: scores.interviewReadiness,
      });

      // Update analytics
      await this.updateAnalytics(userId, session, scores);

      return session;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Add transcript entry for a question
   */
  async addTranscript(sessionId, userId, questionIndex, question, answer, audioUrl = null) {
    try {
      const transcript = await InterviewTranscript.create({
        sessionId,
        userId,
        questionIndex,
        question,
        answer,
        audioUrl,
      });

      return transcript;
    } catch (error) {
      console.error('Error adding transcript:', error);
      throw error;
    }
  }

  /**
   * Update transcript with analysis
   */
  async updateTranscriptAnalysis(transcriptId, userId, analysisData) {
    try {
      const transcript = await InterviewTranscript.findOne({
        where: { id: transcriptId }
      });

      if (!transcript) {
        throw new Error('Transcript not found');
      }

      await transcript.update({
        fluencyScore: analysisData.fluencyScore,
        clarityScore: analysisData.clarityScore,
        pronunciationScore: analysisData.pronunciationScore,
        confidenceScore: analysisData.confidenceScore,
        communicationScore: analysisData.communicationScore,
        grammarScore: analysisData.grammarScore,
        vocabularyScore: analysisData.vocabularyScore,
        responseStructureScore: analysisData.responseStructureScore,
        starFrameworkScore: analysisData.starFrameworkScore,
        technicalScore: analysisData.technicalScore || 0,
        analysisData: {
          fillers: analysisData.fillers,
          grammarIssues: analysisData.grammarIssues,
          keywords: analysisData.keywords,
          concepts: analysisData.concepts,
          speakingPace: analysisData.speakingPace,
          sentimentScore: analysisData.sentimentScore,
          pitchHistory: analysisData.pitchHistory,
          rmsHistory: analysisData.rmsHistory,
          timestamps: analysisData.timestamps,
          confidenceHistory: analysisData.confidenceHistory,
          nervousMoments: analysisData.nervousMoments,
          nervousnessScore: analysisData.nervousnessScore,
          audioSuggestions: analysisData.audioSuggestions,
          metrics: analysisData.metrics,
        },
      });

      return transcript;
    } catch (error) {
      console.error('Error updating transcript analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate session scores
   */
  calculateSessionScores(transcripts) {
    if (!transcripts || transcripts.length === 0) {
      return {
        overall: 0,
        communication: 0,
        technical: 0,
        behavior: 0,
        confidence: 0,
        interviewReadiness: 0,
      };
    }

    const communicationScores = transcripts.map(t => t.communicationScore || 0);
    const technicalScores = transcripts.map(t => t.technicalScore || 0);
    const confidenceScores = transcripts.map(t => t.confidenceScore || 0);

    const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const communication = Math.round(average(communicationScores));
    const technical = Math.round(average(technicalScores));
    const confidence = Math.round(average(confidenceScores));
    const behavior = Math.round(average(transcripts.map(t => t.starFrameworkScore || 0)));

    const overall = Math.round((communication + technical + behavior + confidence) / 4);
    const interviewReadiness = Math.round((communication * 0.4 + technical * 0.35 + behavior * 0.15 + confidence * 0.1));

    return {
      overall,
      communication,
      technical,
      behavior,
      confidence,
      interviewReadiness,
    };
  }

  /**
   * Get session with full details
   */
  async getSessionWithDetails(sessionId, userId) {
    try {
      const session = await InterviewSession.findOne({
        where: { id: sessionId, userId },
        include: [
          {
            model: InterviewTranscript,
            order: [['createdAt', 'ASC']]
          },
          {
            model: InterviewPrep,
            attributes: ['company', 'role', 'jobDescription']
          }
        ]
      });

      return session;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for user
   */
  async getUserSessions(userId, limit = 50) {
    try {
      const sessions = await InterviewSession.findAll({
        where: { userId },
        include: [
          {
            model: InterviewPrep,
            attributes: ['company', 'role']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  /**
   * Update analytics for user
   */
  async updateAnalytics(userId, session, scores) {
    try {
      let analytics = await InterviewAnalytics.findOne({
        where: { userId }
      });

      if (!analytics) {
        analytics = await InterviewAnalytics.create({ userId });
      }

      // Update totals
      const totalInterviews = analytics.totalInterviews + 1;
      const completedInterviews = analytics.completedInterviews + (session.status === 'completed' ? 1 : 0);

      // Update trends
      const communicationTrend = [...(analytics.communicationTrend || []), scores.communication];
      const technicalTrend = [...(analytics.technicalTrend || []), scores.technical];
      const confidenceTrend = [...(analytics.confidenceTrend || []), scores.confidence];

      // Calculate averages
      const avgCommunication = communicationTrend.reduce((a, b) => a + b, 0) / communicationTrend.length;
      const avgTechnical = technicalTrend.reduce((a, b) => a + b, 0) / technicalTrend.length;
      const avgConfidence = confidenceTrend.reduce((a, b) => a + b, 0) / confidenceTrend.length;

      await analytics.update({
        totalInterviews,
        completedInterviews,
        averageCommunicationScore: Math.round(avgCommunication),
        averageTechnicalScore: Math.round(avgTechnical),
        averageConfidenceScore: Math.round(avgConfidence),
        communicationTrend: communicationTrend.slice(-20), // Keep last 20
        technicalTrend: technicalTrend.slice(-20),
        confidenceTrend: confidenceTrend.slice(-20),
        successRate: Math.round((completedInterviews / totalInterviews) * 100),
      });

      return analytics;
    } catch (error) {
      console.error('Error updating analytics:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId) {
    try {
      const analytics = await InterviewAnalytics.findOne({
        where: { userId }
      });

      return analytics || null;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}
