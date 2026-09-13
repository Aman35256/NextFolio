import Agent from './Agent.js';
import { Job, CandidateProfile, InterviewPrep } from '../models/index.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class InterviewAgent extends Agent {
  constructor(orchestrator) {
    super('Interview', orchestrator);
    this.hasApiKey = !!process.env.OPENAI_API_KEY;
  }

  async initialize() {
    await super.initialize();
    this.eventBus.subscribe('interview.scheduled', async (data) => {
      await this.run(data);
    });
  }

  async run(data) {
    const { userId, jobId, company, role } = data;
    this.log(`Generating interview prep material for user ${userId} / job ${jobId}`);

    try {
      const profile = await CandidateProfile.findOne({ where: { userId } });
      const job = await Job.findByPk(jobId);

      if (!profile || !job) {
        throw new Error('CandidateProfile or Job not found');
      }

      let prepData;

      if (this.hasApiKey) {
        try {
          prepData = await this.generatePrepWithLLM(profile, job);
        } catch (llmErr) {
          this.error('Python agent interview prep generation failed, falling back to algorithm', llmErr);
          prepData = this.generatePrepWithTemplates(profile, job);
        }
      } else {
        prepData = this.generatePrepWithTemplates(profile, job);
      }

      const [prep, created] = await InterviewPrep.findOrCreate({
        where: { userId, company: job.company, role: job.role },
        defaults: {
          userId,
          company: job.company,
          role: job.role,
          ...prepData,
          status: 'pending',
        },
      });

      if (!created) {
        await prep.update(prepData);
      }

      this.log(`Interview prep generated successfully for ${job.role} at ${job.company}`);
      
      // Notify user
      this.eventBus.publish('notification.dispatch', {
        userId,
        type: 'interview_prep',
        message: `Your prep material is ready for the ${job.role} interview at ${job.company}! Head to the Interview Prep tab to start practicing.`,
      });

      return prep;
    } catch (err) {
      this.error(`Error generating interview prep for user ${userId}`, err);
    }
  }

  async generatePrepWithLLM(profile, job) {
    return await runPythonAgent('interview.prep', { profile, job });
  }

  generatePrepWithTemplates(profile, job) {
    const skills = profile.topSkills || ['Coding'];
    const company = job.company;
    const role = job.role;

    return {
      questions: {
        technical: [
          { question: `Explain your experience working with ${skills[0] || 'software tools'} in production.`, answerOutline: 'Discuss projects, challenges, metrics, and lessons learned.' },
          { question: `What are some best practices for managing state or scaling codebases in ${skills[1] || 'modern tech stacks'}?`, answerOutline: 'Explain modularity, component design, state store design, and optimization.' },
          { question: 'Describe how you troubleshoot critical performance bottlenecks on the client or server.', answerOutline: 'Mention profiling tools, network analysis, database optimization, and caching strategies.' },
          { question: 'What is your approach to writing testable code and implementing CI/CD pipelines?', answerOutline: 'Mention unit tests, integration tests, mock endpoints, and test coverage targets.' },
          { question: `How do you ensure security and clean data fetching using ${skills[2] || 'standard REST/GraphQL protocols'}?`, answerOutline: 'Discuss CORS, headers, auth validation, encryption, and secure API structures.' },
        ],
        hr: [
          { question: 'Tell me about a time you had a conflict with a team member. How did you resolve it?', answerOutline: 'Describe the conflict objectively, focus on active listening, compromises, and mutual goals.' },
          { question: 'Why do you want to join our engineering team here at ' + company + '?', answerOutline: 'Highlight company culture, product mission, technical challenges, and career alignment.' },
          { question: 'Describe a challenging project you delivered under a tight deadline. How did you manage it?', answerOutline: 'Detail scoping prioritizations, teamwork, transparent updates, and successful release.' },
          { question: 'How do you handle feedback or criticism on your code during peer reviews?', answerOutline: 'Emphasize growth mindset, collaboration, objective evaluation, and professional communication.' },
          { question: 'Tell me about a time you took the lead on a project or initiative.', answerOutline: 'Detail the vision, delegation, coordination, execution, and final metrics achieved.' },
        ],
        systemDesign: [
          { question: 'Design a real-time notification dispatch system at scale.', answerOutline: 'Discuss message queues (Redis/Kafka), pub-sub patterns, DB schemas, connection state, and retries.' },
          { question: 'Design an analytics dashboard that processes millions of clicks daily.', answerOutline: 'Detail time-series databases, stream processors, pipeline aggregation, caching, and frontend latency mitigation.' },
          { question: 'Design a secure file/resume parsing pipeline supporting multiple formats.', answerOutline: 'Discuss object storage (S3), background worker queues, AI service workers, and rate limits.' },
        ],
      },
      mockQuestions: [
        `Welcome to your mock interview for the ${role} role at ${company}! Let's start with a brief overview of your background. Can you walk me through your experience with ${skills.slice(0, 2).join(' and ')}?`,
        `That's great. Can you describe a complex technical challenge you solved in a past project? What was your approach?`,
        `Perfect. Lastly, how do you handle collaborative environments, especially when working on system architectures or tight deadlines?`,
      ],
    };
  }

  async gradeMockInterview(prepId, chatHistory) {
    this.log(`Grading mock interview for prep ID: ${prepId}`);
    try {
      const prep = await InterviewPrep.findByPk(prepId);
      if (!prep) throw new Error('Interview prep record not found');

      let gradingResult;

      if (this.hasApiKey) {
        try {
          gradingResult = await this.gradeWithLLM(prep, chatHistory);
        } catch (err) {
          this.error('Python agent grading failed, falling back to algorithm', err);
          gradingResult = this.gradeWithAlgorithm(chatHistory);
        }
      } else {
        gradingResult = this.gradeWithAlgorithm(chatHistory);
      }

      await prep.update({
        mockChatHistory: chatHistory,
        mockScore: gradingResult.score,
        mockFeedback: gradingResult.feedback,
        status: 'completed',
      });

      return prep;
    } catch (err) {
      this.error(`Failed to grade mock interview for prep ${prepId}`, err);
    }
  }

  async gradeWithLLM(prep, chatHistory) {
    return await runPythonAgent('interview.grade', { prep, chatHistory });
  }

  gradeWithAlgorithm(chatHistory) {
    const userMessages = chatHistory.filter((msg) => msg.role === 'user');
    const wordCount = userMessages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0);

    let score = 65; // base score for participation

    // Increase score based on text richness
    if (wordCount > 150) score += 20;
    else if (wordCount > 70) score += 10;

    // Check for structure words like "first", "solved", "technically", etc.
    const keyWords = ['react', 'node', 'solved', 'challenge', 'team', 'scale', 'database', 'typescript', 'architecture'];
    let matchesCount = 0;
    const historyText = userMessages.map((m) => m.content.toLowerCase()).join(' ');
    
    keyWords.forEach((word) => {
      if (historyText.includes(word)) {
        matchesCount++;
      }
    });

    score += Math.min(matchesCount * 2, 15);
    score = Math.min(score, 100);

    const feedback = `Good effort on your mock interview! You provided answers averaging ${Math.round(wordCount / (userMessages.length || 1))} words per response. Strengths: Clear responses, engaged in questions. Areas of Improvement: Incorporate more technical terminology (e.g. state management, API structures) and follow the STAR framework (Situation, Task, Action, Result) closely for behavioral questions.`;

    return { score, feedback };
  }
}
