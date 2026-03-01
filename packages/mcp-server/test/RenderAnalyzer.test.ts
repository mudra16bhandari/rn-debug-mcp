import { EventBuffer } from '../src/collector/EventBuffer';
import { RenderAnalyzer } from '../src/analysis/RenderAnalyzer';

describe('RenderAnalyzer', () => {
  let buffer: EventBuffer;
  let analyzer: RenderAnalyzer;

  beforeEach(() => {
    buffer = new EventBuffer();
    analyzer = new RenderAnalyzer(buffer);
  });

  it('should detect high frequency renders', () => {
    for (let i = 0; i < 10; i++) {
      buffer.push({ type: 'render', component: 'HeavyComp', timestamp: Date.now() });
    }

    const findings = analyzer.analyzeFrequency();
    expect(findings).toHaveLength(1);
    expect(findings[0].component).toBe('HeavyComp');
    expect(findings[0].severity).toBe('warning');
  });

  it('should detect unnecessary renders', () => {
    for (let i = 0; i < 12; i++) {
      buffer.push({
        type: 'render_check',
        component: 'MemoCandidate',
        propsChanged: i % 4 === 0, // Props change only 25% of the time
        timestamp: Date.now(),
      } as any);
    }

    const findings = analyzer.analyzeUnnecessaryRenders();
    expect(findings).toHaveLength(1);
    expect(findings[0].component).toBe('MemoCandidate');
    expect(findings[0].title).toContain('unnecessary renders');
  });
});
