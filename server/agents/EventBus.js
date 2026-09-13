import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  publish(event, data) {
    console.log(`[EventBus] Publish: ${event}`, { userId: data?.userId, jobId: data?.jobId });
    this.emit(event, data);
  }

  subscribe(event, callback) {
    this.on(event, callback);
  }

  unsubscribe(event, callback) {
    this.off(event, callback);
  }
}

export const eventBus = new EventBus();
export default eventBus;
