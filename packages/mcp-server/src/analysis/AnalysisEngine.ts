import { EventBuffer } from '../collector/EventBuffer';
import { Finding, HeatmapItem, HeatmapReport, ScreenReport, Severity } from '../collector/types';
import { RenderAnalyzer } from './RenderAnalyzer';
import { CascadeAnalyzer } from './CascadeAnalyzer';
import { ContextAnalyzer } from './ContextAnalyzer';
import { NetworkAnalyzer } from './NetworkAnalyzer';
import { JSThreadAnalyzer } from './JSThreadAnalyzer';

export class AnalysisEngine {
  private render: RenderAnalyzer;
  private cascade: CascadeAnalyzer;
  private context: ContextAnalyzer;
  private network: NetworkAnalyzer;
  private jsThread: JSThreadAnalyzer;

  constructor(
    private buffer: EventBuffer,
    private projectId?: string
  ) {
    this.render = new RenderAnalyzer(buffer, projectId);
    this.cascade = new CascadeAnalyzer(buffer, projectId);
    this.context = new ContextAnalyzer(buffer, projectId);
    this.network = new NetworkAnalyzer(buffer, projectId);
    this.jsThread = new JSThreadAnalyzer(buffer, projectId);
  }

  async sync(): Promise<void> {
    if ('sync' in this.buffer && typeof (this.buffer as any).sync === 'function') {
      await (this.buffer as any).sync();
    }
  }

  explainScreen(screen: string): ScreenReport {
    const findings: Finding[] = [
      ...this.render.analyzeFrequency(screen),
      ...this.render.analyzeUnnecessaryRenders(),
      ...this.cascade.detectCascades(screen),
      ...this.context.analyzeTriggers(screen),
      ...this.network.detectDuplicates(),
      ...this.network.detectSlowRequests(),
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

  getHeatmap(screen: string): HeatmapReport {
    const renders = this.buffer.getByType('render', this.projectId);
    const filteredRenders =
      screen && screen !== 'unknown' && screen !== 'all'
        ? renders.filter((e) => e.screen === screen)
        : renders;

    const components = [...new Set(filteredRenders.map((e) => e.component))];
    const renderCounts = new Map<string, number>();
    filteredRenders.forEach((e) => {
      renderCounts.set(e.component, (renderCounts.get(e.component) ?? 0) + 1);
    });

    if (components.length === 0) {
      return {
        screen,
        items: [],
        summary: `No renders detected for screen "${screen}".`,
      };
    }

    const maxRenders = Math.max(...Array.from(renderCounts.values()), 1);
    const cascadeInvolvement = this.cascade.getInvolvedComponents(
      screen === 'all' ? undefined : screen
    );
    const unnecessaryRatios = this.render.getUnnecessaryRatios(components);

    // Get durations
    const durationEvents = this.buffer.getByType('render_time', this.projectId);
    const durations = new Map<string, number>();
    const durationCounts = new Map<string, number>();
    durationEvents.forEach((e) => {
      durations.set(e.component, (durations.get(e.component) ?? 0) + e.duration);
      durationCounts.set(e.component, (durationCounts.get(e.component) ?? 0) + 1);
    });

    const heatmapItems: HeatmapItem[] = components.map((component) => {
      const freq = (renderCounts.get(component) ?? 0) / maxRenders;
      const cascade = cascadeInvolvement.get(component) ?? 0;
      const normalizedCascade = Math.min(cascade / 5, 1);
      const unnecessary = unnecessaryRatios.get(component) ?? 0;

      const avgDur = (durations.get(component) ?? 0) / (durationCounts.get(component) ?? 1);
      const normalizedDuration = Math.min(avgDur / 50, 1); // 50ms is considered very slow

      const score = Math.round(
        freq * 20 + normalizedCascade * 25 + unnecessary * 25 + normalizedDuration * 30
      );

      let severity: Severity = 'info';
      if (score > 70) severity = 'critical';
      else if (score > 40) severity = 'warning';

      return {
        component,
        score,
        renderCount: renderCounts.get(component) ?? 0,
        cascadeParticipation: cascade,
        unnecessaryRatio: unnecessary,
        avgDuration: avgDur > 0 ? Math.round(avgDur) : undefined,
        severity,
      };
    });

    heatmapItems.sort((a, b) => b.score - a.score);

    return {
      screen,
      items: heatmapItems,
      summary: this.buildHeatmapSummary(screen, heatmapItems),
    };
  }

  getSlowComponents(): Finding[] {
    const times = this.buffer.getByType('render_time', this.projectId);
    const byComponent = new Map<string, number[]>();

    times.forEach((e) => {
      if (!byComponent.has(e.component)) byComponent.set(e.component, []);
      byComponent.get(e.component)!.push(e.duration);
    });

    const findings: Finding[] = [];
    byComponent.forEach((durations, component) => {
      const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
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
      (a, b) => ((b.data?.avgMs as number) ?? 0) - ((a.data?.avgMs as number) ?? 0)
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

  private buildHeatmapSummary(screen: string, items: HeatmapItem[]): string {
    const hotOnes = items.filter(
      (i) => i.severity === 'critical' || i.severity === 'warning'
    ).length;
    if (hotOnes === 0) return `${screen}: No hot components detected.`;
    return `${screen}: ${hotOnes} components showing significant heat. Top offender: ${items[0].component} (${items[0].score}/100)`;
  }
}
