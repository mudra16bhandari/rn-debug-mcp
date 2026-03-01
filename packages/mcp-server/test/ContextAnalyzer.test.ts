import { EventBuffer } from '../src/collector/EventBuffer';
import { ContextAnalyzer } from '../src/analysis/ContextAnalyzer';

describe('ContextAnalyzer', () => {
    let buffer: EventBuffer;
    let analyzer: ContextAnalyzer;

    beforeEach(() => {
        buffer = new EventBuffer({ maxAgeMs: 60000 });
        analyzer = new ContextAnalyzer(buffer);
    });

    it('should detect context-triggered cascades', () => {
        const timestamp = Date.now();

        // Context update followed by multiple renders
        buffer.push({
            type: 'context_update',
            provider: 'TestContext',
            trigger: 'action',
            timestamp: timestamp
        } as any);

        const components = ['A', 'B', 'C', 'D'];
        components.forEach((comp, idx) => {
            buffer.push({
                type: 'render',
                component: comp,
                screen: 'Home',
                timestamp: timestamp + 5 + idx
            } as any);
        });

        const findings = analyzer.analyzeTriggers('Home');
        expect(findings).toHaveLength(1);
        expect(findings[0].title).toBe('Context-triggered render cascade');
        expect(findings[0].data?.provider).toBe('TestContext');
        expect(findings[0].data?.affectedCount).toBe(4);
    });

    it('should ignore renders outside the trigger window', () => {
        const timestamp = Date.now();

        buffer.push({
            type: 'context_update',
            provider: 'TestContext',
            timestamp: timestamp
        } as any);

        // Renders happening way after the context update (default window is 100ms)
        const components = ['A', 'B', 'C'];
        components.forEach((comp, idx) => {
            buffer.push({
                type: 'render',
                component: comp,
                screen: 'Home',
                timestamp: timestamp + 500 + idx
            } as any);
        });

        const findings = analyzer.analyzeTriggers('Home');
        expect(findings).toHaveLength(0);
    });
});
