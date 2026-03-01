import { sendEvent } from '../transport/EventBuffer';
import { getConfig } from '../config';

const INTERVAL_MS = 100;
const BLOCK_THRESHOLD_MS = 50;

let intervalId: ReturnType<typeof setInterval> | null = null;
let last = Date.now();

export function startJSThreadMonitor(): void {
  if (!getConfig().enabled) return;
  if (intervalId !== null) return; // already running

  last = Date.now();
  intervalId = setInterval(() => {
    const now = Date.now();
    const delay = now - last - INTERVAL_MS;

    // Ignore small delays that might be telemetry overhead (e.g. < 5ms over threshold)
    // and ensure we don't flag the initialization/first tick
    if (delay > BLOCK_THRESHOLD_MS && last !== 0) {
      sendEvent({ type: 'js_block', delay });
    }
    last = now;
  }, INTERVAL_MS);
}

export function stopJSThreadMonitor(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
