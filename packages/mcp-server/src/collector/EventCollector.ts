import { EventBuffer } from './EventBuffer';
import { RuntimeEvent } from './types';

export class EventCollector {
  constructor(private buffer: EventBuffer) {}

  // Call this from WS and HTTP handlers
  receive(raw: unknown): { ok: true } | { ok: false; error: string } {
    if (!raw || typeof raw !== 'object') {
      return { ok: false, error: 'Event must be an object' };
    }

    const event = raw as Record<string, unknown>;

    if (!event.type || !event.timestamp) {
      return { ok: false, error: 'Missing type or timestamp' };
    }

    const validTypes = [
      'render',
      'render_check',
      'render_time',
      'js_block',
      'network',
      'navigation',
      'context_update',
    ];

    if (!validTypes.includes(event.type as string)) {
      return { ok: false, error: `Unknown event type: ${event.type}` };
    }

    this.buffer.push(raw as RuntimeEvent);
    return { ok: true };
  }

  getBuffer(): EventBuffer {
    return this.buffer;
  }
}
