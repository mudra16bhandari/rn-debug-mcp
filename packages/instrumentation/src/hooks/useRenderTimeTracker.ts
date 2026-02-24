import { useEffect, useRef } from 'react';
import { sendEvent } from '../transport/EventBuffer';

export function useRenderTimeTracker(componentName: string): void {
    const startTime = useRef<number>(0);

    // We use a ref to track if this is the first render to avoid measuring mount overhead 
    // if we want, but usually we want to measure every render.
    startTime.current = Date.now();

    useEffect(() => {
        const duration = Date.now() - startTime.current;
        if (duration > 0) {
            sendEvent({
                type: 'render_time',
                component: componentName,
                duration,
            });
        }
    });
}
