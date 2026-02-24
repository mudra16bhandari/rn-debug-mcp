import { EventBuffer } from '../collector/EventBuffer';
import { Finding } from '../collector/types';

const CASCADE_WINDOW_MS = 50;
const CASCADE_MIN_COMPONENTS = 3;

export class CascadeAnalyzer {
  constructor(private buffer: EventBuffer) { }

  detectCascades(screen?: string): Finding[] {
    const renders = this.buffer.getByType('render');
    const filtered = screen
      ? renders.filter((e) => e.screen === screen)
      : renders;

    if (filtered.length < CASCADE_MIN_COMPONENTS) return [];

    const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
    const findings: Finding[] = [];

    let i = 0;
    while (i < sorted.length) {
      const window: typeof sorted = [];
      const start = sorted[i].timestamp;
      let j = i;

      while (
        j < sorted.length &&
        sorted[j].timestamp - start <= CASCADE_WINDOW_MS
      ) {
        window.push(sorted[j]);
        j++;
      }

      const unique = new Set(window.map((e) => e.component));
      if (unique.size >= CASCADE_MIN_COMPONENTS) {
        const chain = [...unique].join(' → ');
        findings.push({
          severity: unique.size > 5 ? 'critical' : 'warning',
          screen,
          title: 'Render cascade detected',
          description: `${unique.size} components rendered within ${CASCADE_WINDOW_MS}ms: ${chain}`,
          suggestion:
            'Check if the first component in the chain is triggering unnecessary context updates.',
          data: {
            chain: [...unique],
            windowMs: CASCADE_WINDOW_MS,
            componentCount: unique.size,
          },
        });
        i = j; // skip past this cascade
      } else {
        i++;
      }
    }

    return findings;
  }

  getInvolvedComponents(screen?: string): Map<string, number> {
    const renders = this.buffer.getByType('render');
    const filtered = screen
      ? renders.filter((e) => e.screen === screen)
      : renders;

    const involvement = new Map<string, number>();
    if (filtered.length < CASCADE_MIN_COMPONENTS) return involvement;

    const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);

    let i = 0;
    while (i < sorted.length) {
      const window: typeof sorted = [];
      const start = sorted[i].timestamp;
      let j = i;

      while (
        j < sorted.length &&
        sorted[j].timestamp - start <= CASCADE_WINDOW_MS
      ) {
        window.push(sorted[j]);
        j++;
      }

      const unique = new Set(window.map((e) => e.component));
      if (unique.size >= CASCADE_MIN_COMPONENTS) {
        unique.forEach((comp) => {
          involvement.set(comp, (involvement.get(comp) ?? 0) + 1);
        });
        i = j;
      } else {
        i++;
      }
    }
    return involvement;
  }
}
