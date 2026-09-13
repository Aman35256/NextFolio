import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class PortfolioGenerationAgent extends Agent {
  constructor(orchestrator) {
    super('PortfolioGeneration', orchestrator);
  }

  async run(payload) {
    this.log('Generating theme configs and timelines...');
    return await runPythonAgent('portfolio.generate', payload);
  }
}
