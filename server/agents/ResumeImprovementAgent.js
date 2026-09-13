import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class ResumeImprovementAgent extends Agent {
  constructor(orchestrator) {
    super('ResumeImprovement', orchestrator);
  }

  async run(payload) {
    this.log('Improving resume text and summaries...');
    return await runPythonAgent('resume.improve', payload);
  }
}
