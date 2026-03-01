import { EventBuffer } from '../src/collector/EventBuffer';
import { JSThreadAnalyzer } from '../src/analysis/JSThreadAnalyzer';

describe('JSThreadAnalyzer', () => {
    let buffer: EventBuffer;
    let analyzer: JSThreadAnalyzer;

    beforeEach(() => {
        buffer = new EventBuffer({ maxAgeMs: 60000 });
        analyzer = new JSThreadAnalyzer(buffer);
    });

    it('should detect JS thread blocking', () => {
        buffer.push({
            type: 'js_block',
            delay: 250, // Above 200ms critical threshold
            timestamp: Date.now()
        } as any);

        const findings = analyzer.analyze();
        expect(findings).toHaveLength(1);
        expect(findings[0].severity).toBe('critical');
        expect(findings[0].data?.maxDelay).toBe(250);
    });

    it('should return empty findings if no blocking detected', () => {
        const findings = analyzer.analyze();
        expect(findings).toHaveLength(0);
    });
});
