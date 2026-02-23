import { EventBuffer } from '../collector/EventBuffer';
import { Finding } from '../collector/types';

const HIGH_RENDER_THRESHOLD = 5; // renders in analysis window
const UNNECESSARY_RATIO_THRESHOLD = 0.5; // <50% prop changes = suspicious


export class RenderAnalyzer {
  constructor(private buffer: EventBuffer) { }

  analyzeFrequency(screen?: string): Finding[] {
    const renders = this.buffer.getByType('render');
    const filtered = (screen && screen !== 'unknown')
      ? renders.filter((e) => e.screen === screen)
      : renders;


    const countByComponent = new Map<string, number>();
    filtered.forEach((e) => {
      countByComponent.set(
        e.component,
        (countByComponent.get(e.component) ?? 0) + 1
      );
    });

    const findings: Finding[] = [];
    countByComponent.forEach((count, component) => {
      if (count >= HIGH_RENDER_THRESHOLD) {
        findings.push({
          severity: count > 50 ? 'critical' : 'warning',
          component,
          screen,
          title: `${component} has high render frequency`,
          description: `${component} rendered ${count} times in the analysis window.`,
          suggestion:
            'Check for unnecessary context subscriptions or unstable prop references.',
          data: { renderCount: count },
        });
      }
    });

    return findings;
  }

  analyzeUnnecessaryRenders(componentName?: string): Finding[] {
    const checks = this.buffer.getByType('render_check');
    const filtered = componentName
      ? checks.filter((e) => e.component === componentName)
      : checks;

    const findings: Finding[] = [];
    const components = [...new Set(filtered.map((e) => e.component))];

    components.forEach((component) => {
      const compChecks = filtered.filter((e) => e.component === component);
      const total = compChecks.length;
      const changed = compChecks.filter((e) => e.propsChanged).length;
      const ratio = total > 0 ? changed / total : 1;

      if (total >= 10 && ratio < UNNECESSARY_RATIO_THRESHOLD) {
        findings.push({
          severity: 'warning',
          component,
          title: `${component} has unnecessary renders`,
          description: `${component} rendered ${total} times but props changed only ${changed} times (${Math.round(ratio * 100)}%).`,
          suggestion: `Wrap ${component} with React.memo() to prevent renders when props are unchanged.`,
          data: { total, changed, unchangedRatio: 1 - ratio },
        });
      }
    });

    return findings;
  }
}
