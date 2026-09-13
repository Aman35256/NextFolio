import eventBus from './EventBus.js';

export default class Agent {
  constructor(name, orchestrator) {
    this.name = name;
    this.orchestrator = orchestrator;
    this.eventBus = eventBus;
  }

  log(message, meta = {}) {
    console.log(`[${this.name}Agent] ${message}`, Object.keys(meta).length ? meta : '');
  }

  error(message, error) {
    console.error(`[${this.name}Agent] ERROR: ${message}`, error);
  }

  async initialize() {
    this.log('Initializing...');
  }

  async run(data) {
    throw new Error('Run method must be implemented by subclasses');
  }

  async cleanup() {
    this.log('Cleaning up...');
  }
}
