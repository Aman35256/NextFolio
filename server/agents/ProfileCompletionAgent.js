import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class ProfileCompletionAgent extends Agent {
  constructor(orchestrator) {
    super('ProfileCompletion', orchestrator);
  }

  async run(payload) {
    this.log('Checking profile completeness...');
    return await runPythonAgent('profile.complete', payload);
  }
}
