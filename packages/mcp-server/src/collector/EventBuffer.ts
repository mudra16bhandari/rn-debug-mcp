import { RuntimeEvent } from './types';

export interface BufferConfig {
  maxSize: number; // default 5000
  maxAgeMs: number; // default 5 * 60 * 1000 (5 min)
}

export class EventBuffer {
  private events: RuntimeEvent[] = [];
  private config: BufferConfig;

  constructor(config: Partial<BufferConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 5000,
      maxAgeMs: config.maxAgeMs ?? 5 * 60 * 1000,
    };
  }

  getConfig(): BufferConfig {
    return { ...this.config };
  }

  push(event: RuntimeEvent): void {
    this.evict();
    this.events.push(event);
    if (this.events.length > this.config.maxSize) {
      this.events.shift(); // drop oldest
    }
  }

  getAll(projectId?: string): RuntimeEvent[] {
    this.evict();
    const all = [...this.events];
    if (projectId) {
      return all.filter((e) => !e.projectId || e.projectId === projectId);
    }
    return all;
  }

  getByType<T extends RuntimeEvent['type']>(
    type: T,
    projectId?: string
  ): Extract<RuntimeEvent, { type: T }>[] {
    return this.getAll(projectId).filter(
      (e): e is Extract<RuntimeEvent, { type: T }> => e.type === type
    );
  }

  setEvents(events: RuntimeEvent[]): void {
    this.events = events;
    this.evict(); // Ensure we still respect maxAge
  }

  clear(): void {
    this.events = [];
  }

  size(): number {
    return this.events.length;
  }

  private evict(): void {
    const cutoff = Date.now() - this.config.maxAgeMs;
    this.events = this.events.filter((e) => e.timestamp > cutoff);
  }
}
