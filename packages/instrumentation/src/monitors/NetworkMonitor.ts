import { sendEvent } from '../transport/EventBuffer';
import { getConfig } from '../config';

let patched = false;

export function startNetworkMonitor(): void {
  if (!getConfig().enabled) return;
  if (patched) return;

  patched = true;
  const originalFetch = global.fetch;

  global.fetch = async (...args: Parameters<typeof fetch>) => {
    const start = Date.now();
    const url = typeof args[0] === 'string' ? args[0] : String(args[0]);
    const method = (args[1]?.method ?? 'GET').toUpperCase();
    const config = getConfig();

    // 1. Skip internal MCP server calls (usually WebSocket, but safer to block all localhost:PORT)
    const mcpWsUrl = config.wsUrl;
    let mcpHost = '';
    try {
      mcpHost = new URL(mcpWsUrl.replace('ws://', 'http://').replace('wss://', 'https://')).host;
    } catch {
      // Fallback if URL parsing fails
    }

    const isInternalMCP = mcpHost && url.includes(mcpHost);

    // We filter out internal MCP communication (debugger noise), 
    // but keep everything else (including background system calls like Google connectivity checks)
    // so the user can see what's happening and where it comes from.
    if (isInternalMCP) {
      return originalFetch(...args);
    }

    // Capture stack trace to help identify the calling library/component
    const stack = new Error().stack;

    try {
      const response = await originalFetch(...args);
      sendEvent({
        type: 'network',
        url,
        method,
        duration: Date.now() - start,
        status: response.status,
        stack, // Include stack trace
      });
      return response;
    } catch (err) {
      sendEvent({
        type: 'network',
        url,
        method,
        duration: Date.now() - start,
        status: 0,
        stack, // Include stack trace even on failure
      });
      throw err;
    }
  };
}
