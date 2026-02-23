import { EventBuffer } from '../collector/EventBuffer';
import { Finding, ScreenReport } from '../collector/types';
import { RenderAnalyzer } from './RenderAnalyzer';
import { CascadeAnalyzer } from './CascadeAnalyzer';
import { NetworkAnalyzer } from './NetworkAnalyzer';
import { JSThreadAnalyzer } from './JSThreadAnalyzer';

export class AnalysisEngine {
  private render: RenderAnalyzer;
  private cascade: CascadeAnalyzer;
  private network: NetworkAnalyzer;
  private jsThread: JSThreadAnalyzer;

  constructor(private buffer: EventBuffer) {
    this.render = new RenderAnalyzer(buffer);
    this.cascade = new CascadeAnalyzer(buffer);
    this.network = new NetworkAnalyzer(buffer);
    this.jsThread = new JSThreadAnalyzer(buffer);
  }

  explainScreen(screen: string): ScreenReport {
    const findings: Finding[] = [
      ...this.render.analyzeFrequency(screen),
      ...this.cascade.detectCascades(screen),
      ...this.jsThread.analyze(),
    ];

    findings.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

    return {
      screen,
      analysisWindowMs: this.buffer.getConfig().maxAgeMs,
      findings,
      summary: this.buildSummary(screen, findings),
    };
  }

  detectUnnecessaryRenders(component?: string): Finding[] {
    return this.render.analyzeUnnecessaryRenders(component);
  }

  detectCascades(screen?: string): Finding[] {
    return this.cascade.detectCascades(screen);
  }

  getSlowComponents(): Finding[] {
    const times = this.buffer.getByType('render_time');
    const byComponent = new Map<string, number[]>();

    times.forEach((e) => {
      if (!byComponent.has(e.component)) byComponent.set(e.component, []);
      byComponent.get(e.component)!.push(e.duration);
    });

    const findings: Finding[] = [];
    byComponent.forEach((durations, component) => {
      const avg =
        durations.reduce((s, d) => s + d, 0) / durations.length;
      if (avg > 16) {
        findings.push({
          severity: avg > 50 ? 'critical' : 'warning',
          component,
          title: `${component} renders slowly`,
          description: `Average render duration: ${Math.round(avg)}ms over ${durations.length} renders.`,
          suggestion:
            'Profile the component internals. Look for expensive computations that can be moved to useMemo.',
          data: { avgMs: avg, samples: durations.length },
        });
      }
    });

    return findings.sort(
      (a, b) =>
        ((b.data?.avgMs as number) ?? 0) -
        ((a.data?.avgMs as number) ?? 0)
    );
  }

  detectDuplicateNetworkCalls(): Finding[] {
    return this.network.detectDuplicates();
  }

  private buildSummary(screen: string, findings: Finding[]): string {
    if (findings.length === 0) {
      return `${screen}: No significant performance issues detected.`;
    }

    const critical = findings.filter((f) => f.severity === 'critical').length;
    const warnings = findings.filter((f) => f.severity === 'warning').length;

    return `${screen}: ${critical} critical issue(s), ${warnings} warning(s). Top issue: ${findings[0].title}.`;
  }
}
