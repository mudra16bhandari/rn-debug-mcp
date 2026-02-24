import { EventBuffer } from '../src/collector/EventBuffer';
import { EventCollector } from '../src/collector/EventCollector';
import { AnalysisEngine } from '../src/analysis/AnalysisEngine';

describe('MCP System Integration', () => {
    let buffer: EventBuffer;
    let collector: EventCollector;
    let engine: AnalysisEngine;

    beforeEach(() => {
        buffer = new EventBuffer({ maxAgeMs: 60000 });
        collector = new EventCollector(buffer);
        engine = new AnalysisEngine(buffer);
    });

    test('should detect a heatmap with a "hot" component causing cascades', () => {
        const timestamp = Date.now();

        // Simulate 50 renders of "HeavyComponent" with enough gap between clusters
        for (let i = 0; i < 50; i++) {
            const clusterStart = timestamp + i * 200; // 200ms gap between clusters
            collector.receive({
                type: 'render',
                component: 'HeavyComponent',
                screen: 'Home',
                timestamp: clusterStart
            });

            // Each render of HeavyComponent triggers "ChildA" and "ChildB" (Cascade)
            // but only for the first 20 times
            if (i < 20) {
                collector.receive({
                    type: 'render',
                    component: 'ChildA',
                    screen: 'Home',
                    timestamp: clusterStart + 2
                });
                collector.receive({
                    type: 'render',
                    component: 'ChildB',
                    screen: 'Home',
                    timestamp: clusterStart + 4
                });
            }
        }

        // Add some unnecessary renders for HeavyComponent
        for (let i = 0; i < 15; i++) {
            collector.receive({
                type: 'render_check',
                component: 'HeavyComponent',
                propsChanged: false,
                timestamp: timestamp + 5000 + i
            });
        }

        const heatmap = engine.getHeatmap('Home');

        // Verify results
        const heavyComp = heatmap.items.find(i => i.component === 'HeavyComponent');

        expect(heavyComp?.score).toBeGreaterThan(70);
        expect(heavyComp?.unnecessaryRatio).toBeGreaterThan(0.2);
        expect(heatmap.items[0].component).toBe('HeavyComponent');
    });

    test('should link context updates to render cascades', () => {
        const timestamp = Date.now();

        // 1. Context Update
        collector.receive({
            type: 'context_update',
            provider: 'AuthContext',
            trigger: 'login',
            timestamp: timestamp
        });

        // 2. Immediate Cascade
        const components = ['Header', 'Avatar', 'Sidebar', 'Dashboard'];
        components.forEach((comp, idx) => {
            collector.receive({
                type: 'render',
                component: comp,
                screen: 'App',
                timestamp: timestamp + idx * 5
            });
        });

        const findings = engine.explainScreen('App').findings;
        const contextFinding = findings.find(f => f.title === 'Context-triggered render cascade');

        expect(contextFinding).toBeDefined();
        expect(contextFinding?.description).toContain('AuthContext');
        expect(contextFinding?.description).toContain('login');
        expect(contextFinding?.data?.affectedCount).toBe(4);
    });
});
