import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class PDFGenerationAgent extends Agent {
  constructor(orchestrator) {
    super('PDFGeneration', orchestrator);
  }

  async run(payload) {
    this.log('Generating PDF styling assets...');
    return await runPythonAgent('pdf.generate', payload);
  }
}
