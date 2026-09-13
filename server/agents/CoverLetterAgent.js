import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class CoverLetterAgent extends Agent {
  constructor(orchestrator) {
    super('CoverLetter', orchestrator);
    this.hasApiKey = !!process.env.OPENAI_API_KEY;
  }

  async initialize() {
    await super.initialize();
  }

  async run(data) {
    const { profile, job, preferences } = data;
    this.log(`Generating cover letter for ${job.role} at ${job.company}`);

    try {
      if (this.hasApiKey) {
        try {
          return await this.generateWithLLM(profile, job, preferences);
        } catch (llmErr) {
          this.error('Python agent cover letter generation failed, falling back to template', llmErr);
          return this.generateWithTemplates(profile, job);
        }
      } else {
        return this.generateWithTemplates(profile, job);
      }
    } catch (err) {
      this.error('Error generating cover letter', err);
      return this.generateWithTemplates(profile, job);
    }
  }

  async generateWithLLM(profile, job, preferences) {
    return await runPythonAgent('cover_letter.generate', { profile, job, preferences });
  }

  generateWithTemplates(profile, job) {
    const candidateName = profile.fullName || 'Candidate';
    const company = job.company || 'Company';
    const role = job.role || 'Role';
    const skills = profile.topSkills || ['Software Development'];
    const headline = profile.headline || 'Software Professional';

    const coverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${role} position at ${company}. As a ${headline} with expertise in ${skills.slice(0, 3).join(', ')}, I am excited about the opportunity to contribute to your team.

Throughout my career, I have consistently demonstrated a commitment to writing clean, maintainable code and solving complex technical challenges. I have experience working with cross-functional teams, collaborating on system design, and building robust web applications that align with user needs and business goals.

I am particularly drawn to ${company} because of your reputation for innovation and excellence. I am confident that my background in software development and my passion for continuous learning make me a strong fit for this role.

Thank you for your time and consideration. I look forward to the possibility of discussing how my skills and experience align with your needs.

Sincerely,
${candidateName}`;

    const introduction = `Hi there! I'm ${candidateName}, a ${headline}. I noticed the ${role} opening at ${company} and felt my background in ${skills.slice(0, 2).join(' & ')} would make me a great fit. I'd love to learn more about the team and share how I can add value!`;

    return {
      coverLetter,
      introduction,
      screeningAnswers: {
        why_are_you_interested: `I am highly interested in joining ${company} because of your engineering culture and focus on high-impact projects. The ${role} position perfectly matches my technical skills in ${skills.slice(0, 2).join(' and ')}.`,
        relevant_experience: `I have accumulated years of experience in the software development lifecycle, particularly working with modern stacks containing ${skills.slice(0, 3).join(', ')}. I've previously built projects of similar scale and complexity.`,
      },
    };
  }
}
