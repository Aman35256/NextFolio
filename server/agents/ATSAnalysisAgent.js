import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class ATSAnalysisAgent extends Agent {
  constructor(orchestrator) {
    super('ATSAnalysis', orchestrator);
  }

  async run(payload) {
    this.log('Running ATS alignment checks...');
    return await runPythonAgent('ats.analyze', payload);
  }
}
