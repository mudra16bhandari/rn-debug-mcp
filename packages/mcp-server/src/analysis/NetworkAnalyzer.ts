import { EventBuffer } from '../collector/EventBuffer';
import { Finding } from '../collector/types';

const SLOW_REQUEST_THRESHOLD_MS = 1000;
const DUPLICATE_WINDOW_MS = 2000;

export class NetworkAnalyzer {
  constructor(
    private buffer: EventBuffer,
    private projectId?: string
  ) { }

  detectDuplicates(): Finding[] {
    const events = this.buffer.getByType('network', this.projectId);
    const findings: Finding[] = [];

    // Group by URL + method
    const groups = new Map<string, typeof events>();
    events.forEach((e) => {
      const key = `${e.method}:${e.url}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });

    groups.forEach((calls, key) => {
      const sorted = [...calls].sort((a, b) => a.timestamp - b.timestamp);

      // Find calls within DUPLICATE_WINDOW_MS of each other
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].timestamp - sorted[i].timestamp;
        if (gap < DUPLICATE_WINDOW_MS) {
          findings.push({
            severity: 'warning',
            title: 'Duplicate network call detected',
            description: `${key} was called ${calls.length} times, with calls ${gap}ms apart.`,
            suggestion:
              'Add request deduplication, caching, or check for duplicate useEffect dependencies.',
            data: {
              url: sorted[0].url,
              callCount: calls.length,
              gapMs: gap,
              stack: sorted[0].stack,
            },
          });
          break; // one finding per URL
        }
      }
    });

    return findings;
  }

  detectSlowRequests(): Finding[] {
    const events = this.buffer.getByType('network', this.projectId);
    return events
      .filter((e) => e.duration > SLOW_REQUEST_THRESHOLD_MS)
      .map((e) => ({
        severity: 'warning' as const,
        title: 'Slow network request',
        description: `${e.method} ${e.url} took ${e.duration}ms.`,
        suggestion:
          'Consider adding a loading state, caching the result, or paginating the response.',
        data: { url: e.url, duration: e.duration, stack: e.stack },
      }));
  }
}
