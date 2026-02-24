import { z } from 'zod';
import { AnalysisEngine } from '../../analysis/AnalysisEngine';

export const detectDuplicateNetworkCallsSchema = z.object({});

export function detectDuplicateNetworkCalls(
  engine: AnalysisEngine,
  input: z.infer<typeof detectDuplicateNetworkCallsSchema>
): string {
  const findings = engine.detectDuplicateNetworkCalls();

  if (findings.length === 0) {
    return 'No duplicate network calls detected.';
  }

  const lines: string[] = [];
  findings.forEach((f, i) => {
    lines.push(`[${f.severity.toUpperCase()}] ${i + 1}. ${f.title}`);
    lines.push(` ${f.description}`);

    if (f.data?.stack && typeof f.data.stack === 'string') {
      const stackLines = f.data.stack.split('\n');
      const relevantLines = stackLines
        .filter(l => !l.includes('NetworkMonitor') && !l.includes('EventBuffer') && !l.includes('transport'))
        .slice(0, 3)
        .map(l => `    at ${l.trim().replace(/^at\s+/, '')}`);

      if (relevantLines.length > 0) {
        lines.push(' Source:');
        lines.push(...relevantLines);
      }
    }

    lines.push(` Suggestion: ${f.suggestion}`);
    lines.push('');
  });

  return lines.join('\n');
}
