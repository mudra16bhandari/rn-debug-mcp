import { z } from 'zod';
import { AnalysisEngine } from '../../analysis/AnalysisEngine';

export const getSlowComponentsSchema = z.object({});

export function getSlowComponents(
  engine: AnalysisEngine,
  input: z.infer<typeof getSlowComponentsSchema>
): string {
  const findings = engine.getSlowComponents();

  if (findings.length === 0) {
    return 'No slow components detected.';
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
