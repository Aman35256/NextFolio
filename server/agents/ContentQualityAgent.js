import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class ContentQualityAgent extends Agent {
  constructor(orchestrator) {
    super('ContentQuality', orchestrator);
  }

  async run(payload) {
    this.log('Performing content validation checks...');
    return await runPythonAgent('content.quality', payload);
  }
}
