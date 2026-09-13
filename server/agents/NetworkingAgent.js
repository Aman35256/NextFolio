import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class NetworkingAgent extends Agent {
  constructor(orchestrator) {
    super('Networking', orchestrator);
    this.hasApiKey = !!process.env.OPENAI_API_KEY;
  }

  async initialize() {
    await super.initialize();
  }

  async run(data) {
    const { profile, job, type } = data; // type: 'recruiter', 'manager', 'alumni'
    this.log(`Generating networking message for ${job.company} (${type})`);

    try {
      if (this.hasApiKey) {
        try {
          return await this.generateWithLLM(profile, job, type);
        } catch (llmErr) {
          this.error('Python agent networking generation failed, falling back to templates', llmErr);
          return this.generateWithTemplates(profile, job, type);
        }
      } else {
        return this.generateWithTemplates(profile, job, type);
      }
    } catch (err) {
      this.error('Error generating outreach messages', err);
      return this.generateWithTemplates(profile, job, type);
    }
  }

  async generateWithLLM(profile, job, type) {
    return await runPythonAgent('networking.generate', { profile, job, type });
  }

  generateWithTemplates(profile, job, type) {
    const candidateName = profile.fullName || 'Candidate';
    const company = job.company;
    const role = job.role;
    const skills = profile.topSkills || [];

    let subject = '';
    let message = '';

    if (type === 'recruiter') {
      subject = `Inquiry: ${role} Role at ${company} - ${candidateName}`;
      message = `Hi,

Hope you are doing well.

I recently saw the opening for the ${role} position at ${company} and wanted to reach out. I am a ${profile.headline || 'Software Professional'} with extensive experience in ${skills.slice(0, 3).join(', ')}.

I've been following ${company}'s progress and would love to connect to learn more about what your team is looking for and share how my background in building scale projects aligns with your needs.

I've attached my resume and would appreciate a brief 10-minute call if you have availability this week.

Best regards,
${candidateName}`;
    } else if (type === 'manager') {
      subject = `Reaching out: ${role} opening - ${candidateName}`;
      message = `Hi,

I hope you're having a great week.

I came across your team's work at ${company} and saw the open ${role} position. As an engineer specializing in ${skills.slice(0, 2).join(' and ')}, I wanted to introduce myself.

I have a strong background in developing robust applications, similar to the work your team is shipping. I am very interested in the technical problems you are tackling and would love to chat briefly about how my skill set could contribute to your goals.

Do you have 10 minutes to connect sometime next Tuesday?

Thanks,
${candidateName}`;
    } else {
      // Alumni / referral
      subject = `NextFolio Connection / Learning about ${company}`;
      message = `Hi,

I hope you are doing well.

I noticed that you also graduated from our alma mater and are now working at ${company} as an engineer. I am currently exploring opportunities and saw the open ${role} role on your team.

If you have a few minutes, I'd love to ask about your experience working at ${company} and get any advice you might have for someone applying to the team. 

Thank you so much for your time, and I look forward to connecting!

Best,
${candidateName}`;
    }

    return {
      outreachType: type,
      subject,
      message,
    };
  }
}
