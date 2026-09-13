import Agent from './Agent.js';
import {
  SkillNode,
  PersonalInfo,
  CandidateProfile,
  Experience,
  Education,
  Project,
  AgentSettings,
  InterviewAnalytics,
  DailyPlan,
  KnowledgeRoadmap
} from '../models/index.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class MentorshipAgent extends Agent {
  constructor(orchestrator) {
    super('Mentorship', orchestrator);
  }

  async initialize() {
    await super.initialize();
  }

  async run(data) {
    const { userId, message, chatHistory } = data;
    this.log(`Tutor query from user ${userId}: "${message}"`);

    // Fetch rich user context
    let userContext = {};
    let settings = null;
    try {
      const [
        personalInfo,
        candidateProfile,
        experiences,
        educations,
        projects,
        skills,
        roadmap,
        agentSettings,
        interviewAnalytics,
        dailyPlan
      ] = await Promise.all([
        PersonalInfo.findOne({ where: { UserId: userId } }).catch(() => null),
        CandidateProfile.findOne({ where: { userId } }).catch(() => null),
        Experience.findAll({ where: { UserId: userId } }).catch(() => []),
        Education.findAll({ where: { UserId: userId } }).catch(() => []),
        Project.findAll({ where: { UserId: userId } }).catch(() => []),
        SkillNode.findAll({ where: { userId } }).catch(() => []),
        KnowledgeRoadmap.findOne({ where: { userId } }).catch(() => null),
        AgentSettings.findOne({ where: { userId } }).catch(() => null),
        InterviewAnalytics.findOne({ where: { userId } }).catch(() => null),
        DailyPlan.findOne({ where: { userId } }).catch(() => null),
      ]);

      settings = agentSettings;

      userContext = {
        personalInfo: personalInfo ? personalInfo.toJSON() : null,
        candidateProfile: candidateProfile ? candidateProfile.toJSON() : null,
        experiences: experiences.map(e => e.toJSON()),
        educations: educations.map(e => e.toJSON()),
        projects: projects.map(p => p.toJSON()),
        skills: skills.map(s => s.name),
        roadmap: roadmap ? roadmap.toJSON() : null,
        settings: settings ? settings.toJSON() : null,
        interviewAnalytics: interviewAnalytics ? interviewAnalytics.toJSON() : null,
        dailyPlan: dailyPlan ? dailyPlan.toJSON() : null,
      };
    } catch (dbErr) {
      this.error(`Database error fetching context for user ${userId}`, dbErr);
    }

    try {
      let result;
      try {
        result = await runPythonAgent('mentorship.chat', { message, chatHistory, userContext });
      } catch (apiErr) {
        this.error('FastAPI agent mentorship chat failed, falling back to local mentor reply', apiErr);
        const fallbackReply = this.generateLocalMentorReply(message, userContext);
        return {
          reply: fallbackReply + `\n\n⚠️ *Note: Could not connect to local AI Learning Tutor Agent (${apiErr.message || 'unknown error'}). Falling back to offline local mentor replies.*`,
          detectedMode: 'tutor',
          detectedLevel: 'intermediate',
          proactiveSuggestion: null
        };
      }

      // Persist tutorMemory if returned
      if (result && result.tutorMemory && settings) {
        try {
          const currentLearnings = settings.agentLearnings || {};
          currentLearnings.tutorMemory = {
            ...(currentLearnings.tutorMemory || {}),
            ...result.tutorMemory
          };
          await settings.update({ agentLearnings: currentLearnings });
          this.log(`Updated tutor memory for user ${userId}`);
        } catch (memErr) {
          this.error(`Failed to save tutor memory for user ${userId}`, memErr);
        }
      }

      return {
        reply: result.reply || result.output?.reply || 'I am ready to help you learn!',
        detectedMode: result.detectedMode || 'tutor',
        detectedLevel: result.detectedLevel || 'intermediate',
        proactiveSuggestion: result.proactiveSuggestion || null
      };
    } catch (err) {
      this.error(`Error in mentorship session for user ${userId}`, err);
      return {
        reply: 'I encountered an error connecting to your AI Mentor. Let me help you review JavaScript in the meantime!',
        detectedMode: 'tutor',
        detectedLevel: 'intermediate',
        proactiveSuggestion: null
      };
    }
  }

  generateLocalMentorReply(message, context = {}) {
    const query = message.toLowerCase();
    const userName = context.personalInfo?.fullName || 'there';
    const targetRole = context.roadmap?.targetRole || 'Software Engineer';
    
    if (query.includes('quiz') || query.includes('test') || query.includes('question')) {
      return `Hi ${userName}! Here is a custom quiz question for you to practice:

**Topic: Docker Containerization**
Which of the following commands would you run to spin up a container in the background (detached mode)?

1. \`docker run -d nginx\`
2. \`docker run -it nginx\`
3. \`docker start -f nginx\`
4. \`docker exec -d nginx\`

*Reply with 1, 2, 3, or 4 to check your answer!*`;
    }

    if (query.includes('docker')) {
      return `Docker is a platform designed to help you create, deploy, and run applications by using containers. 
Containers allow a developer to package up an application with all of the parts it needs, such as libraries and other dependencies, and ship it all out as one package.

**Key concepts:**
1. **Dockerfile:** A text document containing all the commands a user could call on the command line to assemble an image.
2. **Image:** A read-only template with instructions for creating a Docker container.
3. **Container:** A runnable instance of an image.

Try typing **"Give me a quiz"** to test your docker knowledge!`;
    }

    if (query.includes('react')) {
      return `React is a popular open-source JavaScript library for building user interfaces, particularly for single-page applications. It is maintained by Meta and a community of individual developers and companies.

**Core Principles:**
1. **Components:** Reusable UI bricks that encapsulate logic and layout.
2. **Virtual DOM:** Re-renders only changed elements instead of reload, optimizing speed.
3. **State & Props:** Props pass data down components, while state manages local variables inside components.

Would you like to solve a React exercise? Reply **"React quiz"** to test yourself!`;
    }

    if (query.includes('1') && query.length < 5) {
      return `🎉 **Correct!** Running \`docker run -d\` runs the container in detached mode, meaning it runs in the background. Excellent job! You earn 50 XP!`;
    }

    if (['2', '3', '4'].some(num => query.includes(num)) && query.length < 5) {
      return `❌ **Incorrect.** Option 1 is correct. \`-d\` stands for detached mode, running the container in the background. Options like \`-it\` run the container interactively, which attaches standard input/output streams. Let's try another topic!`;
    }

    return `Hello ${userName}! As your NextFolio Career Mentor, I can help you prepare for your goal as a **${targetRole}**.

Here is what I can do:
1. **Explain concepts** (e.g. Docker, React, Redis, AWS, System Design)
2. **Generate quizzes** (type "Give me a quiz")
3. **Suggest learning steps** to get job ready.

What skill or framework would you like to review today?`;
  }
}

