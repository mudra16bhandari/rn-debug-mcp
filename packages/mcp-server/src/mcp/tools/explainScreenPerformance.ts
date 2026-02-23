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
    lines.push(` Suggestion: ${f.suggestion}`);
    lines.push('');
  });

  return lines.join('\n');
}
