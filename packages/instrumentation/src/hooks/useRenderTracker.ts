import { useRef } from 'react';
import { sendRenderEvent } from '../transport/EventBuffer';

export function useRenderTracker(
  componentName: string,
  screen?: string
): void {
  const renderCount = useRef(0);
  renderCount.current++;
  sendRenderEvent(componentName, screen);
}
