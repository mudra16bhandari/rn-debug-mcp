import { useRef } from 'react';
import { sendRenderEvent } from '../transport/EventBuffer';
import { getCurrentScreen } from '../config';

export function useRenderTracker(componentName: string, screen?: string): void {
  const renderCount = useRef(0);
  renderCount.current++;
  sendRenderEvent(componentName, screen || getCurrentScreen());
}
