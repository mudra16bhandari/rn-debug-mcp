export { configure, setCurrentScreen, getCurrentScreen } from './config';
export { useRenderTracker } from './hooks/useRenderTracker';
export { useRenderCheck } from './hooks/useRenderCheck';
export { useRenderTimeTracker } from './hooks/useRenderTimeTracker';
export { useContextTracker, trackContextTrigger } from './hooks/useContextTracker';
export {
  startJSThreadMonitor,
  stopJSThreadMonitor,
} from './monitors/JSThreadMonitor';
export { startNetworkMonitor } from './monitors/NetworkMonitor';
export { transport } from './transport/EventTransport';

// Convenience: start all monitors at once
import { transport as _transport } from './transport/EventTransport';
import { startJSThreadMonitor as _jsm } from './monitors/JSThreadMonitor';
import { startNetworkMonitor as _nm } from './monitors/NetworkMonitor';

export function initDebugMCP(
  overrides?: Parameters<typeof import('./config').configure>[0]
): void {
  if (overrides) {
    const { configure } = require('./config');
    configure(overrides);
  }
  _transport.connect();
  _jsm();
  _nm();
}
