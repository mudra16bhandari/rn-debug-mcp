import { EventBuffer } from '../collector/EventBuffer';
import { Finding } from '../collector/types';

const CRITICAL_BLOCK_MS = 200;

export class JSThreadAnalyzer {
  constructor(
    private buffer: EventBuffer,
    private projectId?: string
  ) { }

  analyze(): Finding[] {
    const events = this.buffer.getByType('js_block', this.projectId);
    if (events.length === 0) return [];

    const maxDelay = Math.max(...events.map((e) => e.delay));
    const avgDelay = events.reduce((s, e) => s + e.delay, 0) / events.length;

    return [
      {
        severity: maxDelay > CRITICAL_BLOCK_MS ? 'critical' : 'warning',
        title: 'JS thread blocking detected',
        description: `JS thread blocked ${events.length} times. Max delay: ${maxDelay}ms. Average: ${Math.round(avgDelay)}ms.`,
        suggestion:
          'Move heavy computations to useMemo, useCallback, or run them off the main thread using InteractionManager.runAfterInteractions().',
        data: { count: events.length, maxDelay, avgDelay },
      },
    ];
  }
}
