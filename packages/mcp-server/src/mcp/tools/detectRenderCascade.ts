import { z } from 'zod';
import { AnalysisEngine } from '../../analysis/AnalysisEngine';

export const detectRenderCascadeSchema = z.object({
  screen: z.string().optional(),
});

export function detectRenderCascade(
  engine: AnalysisEngine,
  input: z.infer<typeof detectRenderCascadeSchema>
): string {
  const findings = engine.detectCascades(input.screen);

  if (findings.length === 0) {
    return 'No render cascades detected.';
  }

  const lines: string[] = [];
  findings.forEach((f, i) => {
    lines.push(`[${f.severity.toUpperCase()}] ${i + 1}. ${f.title}`);
    lines.push(` ${f.description}`);
    lines.push(` Suggestion: ${f.suggestion}`);
    lines.push('');
  });

  return lines.join('\n');
}
