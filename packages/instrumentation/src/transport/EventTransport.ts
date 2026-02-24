import { getConfig } from '../config';

type AnyEvent = Record<string, unknown>;

class EventTransport {
  private ws: WebSocket | null = null;
  private queue: AnyEvent[] = [];
  private retryDelay = 1000;
  private connected = false;

  connect(): void {
    const cfg = getConfig();
    if (!cfg.enabled) return;

    try {
      this.ws = new WebSocket(cfg.wsUrl);
      this.ws.onopen = () => {
        console.log('[RN Debug MCP] Connected to server');
        this.connected = true;
        this.retryDelay = 1000;
        this.flush();
      };
      this.ws.onclose = (e) => {
        console.log('[RN Debug MCP] Disconnected from server', e.code, e.reason);
        this.connected = false;
        setTimeout(() => this.connect(), this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 2, 30000);
      };
      this.ws.onerror = (e: any) => {
        const message = e.message || 'Connection failed (is the server running?)';
        console.warn(`[RN Debug MCP] WebSocket Error: ${message}`, { url: cfg.wsUrl });
      };

    } catch {
      // WebSocket not available in this environment
    }
  }

  send(event: AnyEvent): void {
    if (!getConfig().enabled) return;
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      this.queue.push(event);
      if (this.queue.length > 200) this.queue.shift(); // cap queue
    }
  }

  private flush(): void {
    const batch = this.queue.splice(0);
    if (batch.length === 0) return;
    this.ws?.send(JSON.stringify(batch));
  }
}

export const transport = new EventTransport();
