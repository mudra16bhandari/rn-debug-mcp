import { EventBuffer } from '../collector/EventBuffer';
import { Finding } from '../collector/types';

const HIGH_RENDER_THRESHOLD = 5; // renders in analysis window
const UNNECESSARY_RATIO_THRESHOLD = 0.5; // <50% prop changes = suspicious

export class RenderAnalyzer {
  constructor(
    private buffer: EventBuffer,
    private projectId?: string
  ) { }

  analyzeFrequency(screen?: string): Finding[] {
    const renders = this.buffer.getByType('render', this.projectId);
    const filtered =
      screen && screen !== 'unknown' && screen !== 'all'
        ? renders.filter((e) => e.screen === screen)
        : renders;

    const countByComponent = new Map<string, number>();
    filtered.forEach((e) => {
      countByComponent.set(e.component, (countByComponent.get(e.component) ?? 0) + 1);
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
          suggestion: 'Check for unnecessary context subscriptions or unstable prop references.',
          data: { renderCount: count },
        });
      }
    });

    return findings;
  }

  analyzeUnnecessaryRenders(componentName?: string): Finding[] {
    const checks = this.buffer.getByType('render_check', this.projectId);
    const filtered = componentName ? checks.filter((e) => e.component === componentName) : checks;

    const findings: Finding[] = [];
    const components = [...new Set(filtered.map((e) => e.component))];

    components.forEach((component) => {
      const compChecks = filtered.filter((e) => e.component === component);
      const isMemo = compChecks.some((e) => e.isMemo);

      const total = compChecks.length;
      const changed = compChecks.filter((e) => e.propsChanged).length;
      const ratio = total > 0 ? changed / total : 1;

      if (total >= 10 && ratio < UNNECESSARY_RATIO_THRESHOLD) {
        const unnecessaryPct = Math.round((1 - ratio) * 100);
        let title = `${component} has unnecessary renders`;
        let suggestion = `Wrap ${component} with React.memo() to prevent renders when props are unchanged.`;

        if (isMemo) {
          title = `[MEMO] ${component} rendered unnecessarily`;
          suggestion = `This component is ALREADY memoized but still rendering unnecessarily (${unnecessaryPct}%). Check for stable props!`;
        }

        findings.push({
          severity: 'warning',
          component,
          title,
          description: `${component} rendered ${total} times but props changed only ${changed} times (${unnecessaryPct}%).`,
          suggestion,
          data: { total, changed, unnecessaryRatio: 1 - ratio, isMemo },
        });
      }
    });

    return findings;
  }

  getUnnecessaryRatios(componentNames: string[]): Map<string, number> {
    const checks = this.buffer.getByType('render_check', this.projectId);
    const ratios = new Map<string, number>();

    componentNames.forEach((component) => {
      const compChecks = checks.filter((e) => e.component === component);
      if (compChecks.length === 0) {
        ratios.set(component, 0);
        return;
      }
      const total = compChecks.length;
      const changed = compChecks.filter((e) => e.propsChanged).length;
      const unnecessaryCount = total - changed;
      ratios.set(component, unnecessaryCount / total);
    });

    return ratios;
  }
}
