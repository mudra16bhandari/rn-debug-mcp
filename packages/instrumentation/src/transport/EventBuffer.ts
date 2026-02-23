import { transport } from './EventTransport';

const DEDUP_WINDOW_MS = 16;

// Track last emit time per component for render dedup
const lastRenderTime = new Map<string, number>();

export function sendRenderEvent(component: string, screen?: string): void {
  const now = Date.now();
  const last = lastRenderTime.get(component) ?? 0;
  if (now - last < DEDUP_WINDOW_MS) return; // drop --- same frame
  lastRenderTime.set(component, now);
  transport.send({ type: 'render', component, screen, timestamp: now });
}

// Non-deduplicated senders
export function sendEvent(event: Record<string, unknown>): void {
  transport.send({ ...event, timestamp: Date.now() });
}
