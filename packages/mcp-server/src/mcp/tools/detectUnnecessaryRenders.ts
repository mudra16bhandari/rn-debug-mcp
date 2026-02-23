import { z } from 'zod';
import { AnalysisEngine } from '../../analysis/AnalysisEngine';

export const detectUnnecessaryRendersSchema = z.object({
  component: z.string().optional(),
});

export function detectUnnecessaryRenders(
  engine: AnalysisEngine,
  input: z.infer<typeof detectUnnecessaryRendersSchema>
): string {
  const findings = engine.detectUnnecessaryRenders(input.component);

  if (findings.length === 0) {
    return 'No unnecessary renders detected.';
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
