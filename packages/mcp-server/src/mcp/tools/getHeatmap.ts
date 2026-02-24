import { z } from 'zod';
import { AnalysisEngine } from '../../analysis/AnalysisEngine';

export const getHeatmapSchema = z.object({
    screen: z.string().describe('The screen name to analyze (e.g. "HomeScreen")'),
});

export function getHeatmap(
    engine: AnalysisEngine,
    input: z.infer<typeof getHeatmapSchema>
): string {
    const report = engine.getHeatmap(input.screen);

    if (report.items.length === 0) {
        return `No data collected for screen "${input.screen}". 
        
Suggestions:
1. Ensure the app is running and instrumented.
2. If you haven't set a screen name, try requesting for "all" or "unknown".
3. Interact with the app to trigger renders.`;
    }

    const lines = [
        `🔥 Performance Heatmap: ${input.screen}`,
        report.summary,
        '',
        'Ranked Components (Score / 100):',
        '',
    ];

    report.items.forEach((item, i) => {
        const status = item.severity.toUpperCase();
        lines.push(`${i + 1}. [${status}] ${item.component}: ${item.score}/100`);
        lines.push(`   - Renders: ${item.renderCount}`);
        if (item.avgDuration) {
            lines.push(`   - Avg Duration: ${item.avgDuration}ms`);
        }
        lines.push(`   - Cascade Participation: ${item.cascadeParticipation} times`);
        lines.push(`   - Unnecessary Ratio: ${Math.round(item.unnecessaryRatio * 100)}%`);

        if (item.severity === 'critical') {
            lines.push('   ⚠️ HIGH PRIORITY: This component is a major bottleneck.');
        } else if (item.severity === 'warning') {
            lines.push('   🔸 IMPROVEMENT RECOMMENDED: Significant overhead detected.');
        }
        lines.push('');
    });

    return lines.join('\n');
}
