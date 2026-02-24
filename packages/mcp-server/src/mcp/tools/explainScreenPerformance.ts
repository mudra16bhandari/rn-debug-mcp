import { z } from 'zod';
import { AnalysisEngine } from '../../analysis/AnalysisEngine';

export const explainScreenPerformanceSchema = z.object({
  screen: z.string().describe('The screen name to analyze (e.g. "ProductScreen")'),
});

export function explainScreenPerformance(
  engine: AnalysisEngine,
  input: z.infer<typeof explainScreenPerformanceSchema>
): string {
  const report = engine.explainScreen(input.screen);

  if (report.findings.length === 0) {
    return `No performance issues detected for ${input.screen} in the current analysis window.`;
  }

  const lines = [report.summary, ''];
  report.findings.forEach((f, i) => {
    lines.push(`[${f.severity.toUpperCase()}] ${i + 1}. ${f.title}`);
    lines.push(` ${f.description}`);

    if (f.data?.stack && typeof f.data.stack === 'string') {
      const stackLines = f.data.stack.split('\n');
      // Skip the first few lines of the stack trace (Error object and instrumentation)
      const relevantLines = stackLines
        .filter(l => !l.includes('NetworkMonitor') && !l.includes('EventBuffer') && !l.includes('transport'))
        .slice(0, 3) // show top 3 relevant frames
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
