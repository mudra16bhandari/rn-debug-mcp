import { EventBuffer } from '../src/collector/EventBuffer';
import { NetworkAnalyzer } from '../src/analysis/NetworkAnalyzer';

describe('NetworkAnalyzer', () => {
    let buffer: EventBuffer;
    let analyzer: NetworkAnalyzer;

    beforeEach(() => {
        buffer = new EventBuffer({ maxAgeMs: 60000 });
        analyzer = new NetworkAnalyzer(buffer);
    });

    it('should detect duplicate requests', () => {
        const timestamp = Date.now();

        buffer.push({
            type: 'network',
            method: 'GET',
            url: 'https://api.example.com/data',
            timestamp: timestamp,
            duration: 100
        } as any);

        buffer.push({
            type: 'network',
            method: 'GET',
            url: 'https://api.example.com/data',
            timestamp: timestamp + 500, // Within 2000ms window
            duration: 100
        } as any);

        const findings = analyzer.detectDuplicates();
        expect(findings).toHaveLength(1);
        expect(findings[0].title).toBe('Duplicate network call detected');
        expect(findings[0].data?.url).toContain('api.example.com');
    });

    it('should detect slow requests', () => {
        buffer.push({
            type: 'network',
            method: 'POST',
            url: 'https://api.example.com/upload',
            timestamp: Date.now(),
            duration: 1500 // Above 1000ms threshold
        } as any);

        const findings = analyzer.detectSlowRequests();
        expect(findings).toHaveLength(1);
        expect(findings[0].title).toBe('Slow network request');
        expect(findings[0].data?.duration).toBe(1500);
    });
});
