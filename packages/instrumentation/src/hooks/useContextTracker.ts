import { useRef } from 'react';
import { sendEvent } from '../transport/EventBuffer';
import { getCurrentScreen } from '../config';

/**
 * Tracks changes to a Context value.
 * Hook to be used inside a Context Provider or a component that consumes context
 * to detect when the context value actually changes.
 */
export function useContextTracker(providerName: string, value: any, screen?: string): void {
    const prevValue = useRef(value);

    if (prevValue.current !== value) {
        sendEvent({
            type: 'context_update',
            provider: providerName,
            screen: screen || getCurrentScreen(),
        });
        prevValue.current = value;
    }
}

/**
 * Manually tracks a trigger that causes a context update (e.g. a dispatch call).
 */
export function trackContextTrigger(providerName: string, triggerName: string = 'dispatch', screen?: string): void {
    sendEvent({
        type: 'context_update',
        provider: providerName,
        trigger: triggerName,
        screen: screen || getCurrentScreen(),
    });
}
