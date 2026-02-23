import { WebSocketServer as WSSServer, WebSocket } from 'ws';
import { EventCollector } from '../collector/EventCollector';

export function createWebSocketServer(
  port: number,
  collector: EventCollector
): WSSServer {
  const wss = new WSSServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    console.error('[WS] Client connected');

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        // Handle both single events and batches
        const events = Array.isArray(parsed) ? parsed : [parsed];
        events.forEach((e) => {
          const result = collector.receive(e);
          if (result.ok) {
            if (e.type === 'render') {
              console.error(`[Event] Render: ${e.component} (${e.screen || 'unknown'})`);
            } else if (e.type === 'js_block') {
              console.error(`[Event] JS Blocked: ${e.delay}ms`);
            } else {
              console.error(`[Event] Received: ${e.type}`);
            }
          } else {
            console.error('[WS] Rejected event:', result.error);
          }
        });

      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    });

    ws.on('close', () => console.error('[WS] Client disconnected'));
  });

  console.error(`[WS] Listening on ws://localhost:${port}`);
  return wss;
}

