import { EventBuffer } from '../src/collector/EventBuffer';
import { CascadeAnalyzer } from '../src/analysis/CascadeAnalyzer';

describe('CascadeAnalyzer', () => {
    let buffer: EventBuffer;
    let analyzer: CascadeAnalyzer;

    beforeEach(() => {
        buffer = new EventBuffer({ maxAgeMs: 60000 });
        analyzer = new CascadeAnalyzer(buffer);
    });

    it('should detect a basic render cascade', () => {
        const timestamp = Date.now();

        // 3 components rendering within 50ms (default window)
        const events = [
            { type: 'render', component: 'A', screen: 'S', timestamp: timestamp },
            { type: 'render', component: 'B', screen: 'S', timestamp: timestamp + 10 },
            { type: 'render', component: 'C', screen: 'S', timestamp: timestamp + 20 },
        ];

        events.forEach(e => buffer.push(e as any));

        const findings = analyzer.detectCascades('S');
        expect(findings).toHaveLength(1);
        expect(findings[0].title).toBe('Render cascade detected');
        expect(findings[0].data?.componentCount).toBe(3);
    });

    it('should not detect cascade when components are spread out', () => {
        const timestamp = Date.now();

        const events = [
            { type: 'render', component: 'A', screen: 'S', timestamp: timestamp },
            { type: 'render', component: 'B', screen: 'S', timestamp: timestamp + 100 },
            { type: 'render', component: 'C', screen: 'S', timestamp: timestamp + 200 },
        ];

        events.forEach(e => buffer.push(e as any));

        const findings = analyzer.detectCascades('S');
        expect(findings).toHaveLength(0);
    });

    it('should ignore duplicate renders of same component in a window', () => {
        const timestamp = Date.now();

        const events = [
            { type: 'render', component: 'A', screen: 'S', timestamp: timestamp },
            { type: 'render', component: 'A', screen: 'S', timestamp: timestamp + 10 },
            { type: 'render', component: 'B', screen: 'S', timestamp: timestamp + 20 },
        ];

        events.forEach(e => buffer.push(e as any));

        // Only 2 unique components, so no cascade (needs 3)
        const findings = analyzer.detectCascades('S');
        expect(findings).toHaveLength(0);
    });
});
