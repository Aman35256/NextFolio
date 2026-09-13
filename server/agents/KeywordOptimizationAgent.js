import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class KeywordOptimizationAgent extends Agent {
  constructor(orchestrator) {
    super('KeywordOptimization', orchestrator);
  }

  async run(payload) {
    this.log('Performing keyword gap comparison...');
    return await runPythonAgent('keyword.optimize', payload);
  }
}
