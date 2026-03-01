import { EventBuffer } from '../collector/EventBuffer';
import { Finding } from '../collector/types';

const TRIGGER_WINDOW_MS = 100;

export class ContextAnalyzer {
  constructor(private buffer: EventBuffer) {}

  analyzeTriggers(screen?: string): Finding[] {
    const contextUpdates = this.buffer.getByType('context_update');
    const renders = this.buffer.getByType('render');
    const filteredRenders =
      screen && screen !== 'all' ? renders.filter((e) => e.screen === screen) : renders;

    const findings: Finding[] = [];

    contextUpdates.forEach((update) => {
      // Find renders that happened shortly after this context update
      const affectedRenders = filteredRenders.filter(
        (r) =>
          r.timestamp >= update.timestamp && r.timestamp <= update.timestamp + TRIGGER_WINDOW_MS
      );

      const uniqueComponents = [...new Set(affectedRenders.map((r) => r.component))];

      if (uniqueComponents.length >= 3) {
        findings.push({
          severity: uniqueComponents.length > 10 ? 'critical' : 'warning',
          title: 'Context-triggered render cascade',
          description: `Update to "${update.provider}" (via ${update.trigger || 'value change'}) triggered ${uniqueComponents.length} components to re-render: ${uniqueComponents.slice(0, 5).join(', ')}${uniqueComponents.length > 5 ? '...' : ''}`,
          suggestion: `Consider splitting ${update.provider} into multiple smaller contexts or using useMemo/React.memo on the affected components.`,
          data: {
            provider: update.provider,
            trigger: update.trigger,
            affectedCount: uniqueComponents.length,
            components: uniqueComponents,
          },
        });
      }
    });

    return findings;
  }
}
