import { EventBuffer } from '../src/collector/EventBuffer';
import { RuntimeEvent } from '../src/collector/types';

describe('EventBuffer', () => {
  it('should store and retrieve events', () => {
    const buffer = new EventBuffer();
    const event: RuntimeEvent = {
      type: 'render',
      component: 'TestComponent',
      timestamp: Date.now(),
    };

    buffer.push(event);
    expect(buffer.getAll()).toHaveLength(1);
    expect(buffer.getAll()[0]).toEqual(event);
  });

  it('should respect maxSize', () => {
    const buffer = new EventBuffer({ maxSize: 2 });
    const event = (i: number): RuntimeEvent => ({
      type: 'render',
      component: `Comp${i}`,
      timestamp: Date.now(),
    });

    buffer.push(event(1));
    buffer.push(event(2));
    buffer.push(event(3));

    expect(buffer.size()).toBe(2);
    const all = buffer.getAll();
    expect((all[0] as any).component).toBe('Comp2');
    expect((all[1] as any).component).toBe('Comp3');
  });

  it('should evict old events', () => {
    jest.useFakeTimers();
    const buffer = new EventBuffer({ maxAgeMs: 1000 });

    buffer.push({
      type: 'render',
      component: 'Old',
      timestamp: Date.now(),
    });

    jest.advanceTimersByTime(2000);

    buffer.push({
      type: 'render',
      component: 'New',
      timestamp: Date.now(),
    });

    expect(buffer.size()).toBe(1);
    expect((buffer.getAll()[0] as any).component).toBe('New');
    jest.useRealTimers();
  });

  it('should filter by type', () => {
    const buffer = new EventBuffer();
    buffer.push({
      type: 'render',
      component: 'Comp1',
      timestamp: Date.now(),
    });
    buffer.push({
      type: 'render_time',
      component: 'Comp1',
      duration: 10,
      timestamp: Date.now(),
    });

    const renders = buffer.getByType('render');
    expect(renders).toHaveLength(1);
    expect(renders[0].type).toBe('render');
  });
});
