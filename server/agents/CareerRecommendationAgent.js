import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class CareerRecommendationAgent extends Agent {
  constructor(orchestrator) {
    super('CareerRecommendation', orchestrator);
  }

  async run(payload) {
    this.log('Mapping salary expectations and progression paths...');
    return await runPythonAgent('career.recommend', payload);
  }
}
